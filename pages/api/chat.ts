import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../lib/supabase";
import { getOrCreateUser } from "../../lib/user-utils";
import {
  estimateConversationTokens,
  estimateTokens,
  calculateCost,
  MODEL_CONFIGS,
} from "../../server/lib/chatTokens";

// Configure edge runtime for streaming
export const config = {
  runtime: "edge",
};

type ChatModel = "gpt-4o" | "claude-sonnet" | "gemini-pro";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UsageMetrics {
  gpt4o_tokens: number;
  claude_tokens: number;
  gemini_tokens: number;
}

// Quota limits by plan
const QUOTA_LIMITS = {
  free: {
    gpt4o_tokens: 0,
    claude_tokens: 0,
    gemini_tokens: 0,
  },
  creator: {
    gpt4o_tokens: 150_000, // ~150 GPT-4o calls
    claude_tokens: 0,
    gemini_tokens: 10_000_000, // 10M Gemini tokens
  },
  pro: {
    gpt4o_tokens: 500_000, // ~500 GPT-4o calls
    claude_tokens: 5_000_000, // 5M Claude tokens
    gemini_tokens: 30_000_000, // 30M Gemini tokens
  },
} as const;

export default async function handler(req: Request): Promise<Response> {
  // Feature flag check
  if (process.env.NEXT_PUBLIC_CHAT_ENABLED !== "true") {
    return new Response(JSON.stringify({ error: "Chat feature is disabled" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse request body
    const {
      messages,
      model,
      stream = true,
    } = (await req.json()) as {
      messages: ChatMessage[];
      model: ChatModel;
      stream?: boolean;
    };

    // Validate inputs
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!["gpt-4o", "claude-sonnet", "gemini-pro"].includes(model)) {
      return new Response(
        JSON.stringify({ error: "Invalid model specified" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user authentication
    const auth = getAuth(req as any);
    const clerkUserId = auth?.userId;

    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Please sign in" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user from database
    const userResult = await getOrCreateUser(clerkUserId);
    if (!userResult.success || !userResult.user) {
      return new Response(JSON.stringify({ error: "Failed to get user" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = userResult.user.id;

    // Get user plan from Clerk metadata
    const userPlan =
      (auth.sessionClaims?.publicMetadata as any)?.plan || "free";

    // Estimate input tokens
    const inputTokens = estimateConversationTokens(messages, model);

    // Check quota limits
    const quotaCheck = await checkTokenQuota(
      userId,
      model,
      inputTokens,
      userPlan
    );
    if (!quotaCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "TOO_MANY_REQUESTS",
          message: quotaCheck.message,
          quotaInfo: quotaCheck.quotaInfo,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call the appropriate AI provider
    const response = await callProvider(model, messages);

    if (stream) {
      return handleStreamingResponse(response, model, userId, inputTokens);
    } else {
      return handleNonStreamingResponse(response, model, userId, inputTokens);
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function checkTokenQuota(
  userId: string,
  model: ChatModel,
  tokens: number,
  plan: string
): Promise<{ allowed: boolean; message?: string; quotaInfo?: any }> {
  try {
    // Get current usage
    const { data: usage } = await supabaseAdmin
      .from("usage_meter")
      .select("*")
      .eq("user_id", userId)
      .single();

    const currentUsage: UsageMetrics = usage || {
      gpt4o_tokens: 0,
      claude_tokens: 0,
      gemini_tokens: 0,
    };

    // Get quota limits for user's plan
    const limits =
      QUOTA_LIMITS[plan as keyof typeof QUOTA_LIMITS] || QUOTA_LIMITS.free;

    const tokenField =
      model === "gpt-4o"
        ? "gpt4o_tokens"
        : model === "claude-sonnet"
          ? "claude_tokens"
          : "gemini_tokens";

    const currentUsageForModel = currentUsage[tokenField] || 0;
    const limitForModel = limits[tokenField];

    if (currentUsageForModel + tokens > limitForModel) {
      return {
        allowed: false,
        message: `Token quota exceeded for ${model}. Used: ${currentUsageForModel}/${limitForModel}`,
        quotaInfo: {
          current: currentUsageForModel,
          limit: limitForModel,
          requested: tokens,
          model,
        },
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Quota check error:", error);
    // Allow request on quota check error to prevent service disruption
    return { allowed: true };
  }
}

async function callProvider(
  model: ChatModel,
  messages: ChatMessage[]
): Promise<Response> {
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  switch (model) {
    case "gpt-4o":
      return callOpenAI(messages);
    case "claude-sonnet":
      return callAnthropic(systemMessage?.content, conversationMessages);
    case "gemini-pro":
      return callGemini(messages);
    default:
      throw new Error(`Unsupported model: ${model}`);
  }
}

async function callOpenAI(messages: ChatMessage[]): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      stream: true,
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });
}

async function callAnthropic(
  systemPrompt: string | undefined,
  messages: ChatMessage[]
): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic API key not configured");
  }

  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
  });
}

async function callGemini(messages: ChatMessage[]): Promise<Response> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Google API key not configured");
  }

  // Convert messages to Gemini format
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 4000,
          temperature: 0.7,
        },
      }),
    }
  );
}

async function handleStreamingResponse(
  response: Response,
  model: ChatModel,
  userId: string,
  inputTokens: number
): Promise<Response> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body available");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let outputTokens = 0;
  let responseContent = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = extractContentFromChunk(parsed, model);
                if (content) {
                  responseContent += content;
                  outputTokens += estimateTokens(content, model);
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        // Update usage meter
        await updateUsageMeter(userId, model, inputTokens + outputTokens);

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function handleNonStreamingResponse(
  response: Response,
  model: ChatModel,
  userId: string,
  inputTokens: number
): Promise<Response> {
  const data = await response.json();
  const content = extractFullContent(data, model);
  const outputTokens = estimateTokens(content, model);

  // Update usage meter
  await updateUsageMeter(userId, model, inputTokens + outputTokens);

  return new Response(JSON.stringify({ content }), {
    headers: { "Content-Type": "application/json" },
  });
}

function extractContentFromChunk(chunk: any, model: ChatModel): string | null {
  switch (model) {
    case "gpt-4o":
      return chunk.choices?.[0]?.delta?.content || null;
    case "claude-sonnet":
      return chunk.delta?.text || null;
    case "gemini-pro":
      return chunk.candidates?.[0]?.content?.parts?.[0]?.text || null;
    default:
      return null;
  }
}

function extractFullContent(data: any, model: ChatModel): string {
  switch (model) {
    case "gpt-4o":
      return data.choices?.[0]?.message?.content || "";
    case "claude-sonnet":
      return data.content?.[0]?.text || "";
    case "gemini-pro":
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    default:
      return "";
  }
}

async function updateUsageMeter(
  userId: string,
  model: ChatModel,
  tokens: number
): Promise<void> {
  try {
    const tokenField =
      model === "gpt-4o"
        ? "gpt4o_tokens"
        : model === "claude-sonnet"
          ? "claude_tokens"
          : "gemini_tokens";

    await supabaseAdmin.from("usage_meter").upsert(
      {
        user_id: userId,
        [tokenField]: tokens,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    );
  } catch (error) {
    console.error("Failed to update usage meter:", error);
    // Don't throw - usage tracking failure shouldn't break the response
  }
}
