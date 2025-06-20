// @or OpenRouter Chat API (REST endpoint)
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
// import { useOpenRouter } from "../../server/lib/useOpenRouter";
import { estimateConversationTokens } from "../../server/lib/chatTokens";
import { MODEL_ALIASES, ChatModel } from "../../types/chatModels";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  model: ChatModel;
  messages: ChatMessage[];
}

// @or Stub helper for usage logging
async function logUsage(
  userId: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  // TODO: Implement actual usage logging to database
  console.log(
    `Usage logged: ${userId}, ${model}, ${inputTokens} in, ${outputTokens} out`
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // @or Guard behind feature flag
    const isOpenRouterEnabled =
      process.env.NEXT_PUBLIC_USE_OPENROUTER === "true";
    if (!isOpenRouterEnabled) {
      return res.status(503).json({
        error: "Chat feature is not yet available",
      });
    }

    // Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      model,
      messages,
      stream = false,
    }: ChatRequest & { stream?: boolean } = req.body;

    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    // validate incoming model
    const validatedModel: ChatModel = MODEL_ALIASES[model]
      ? model
      : "openai/gpt-4o";

    // @or Estimate input tokens
    const inputTokens = estimateConversationTokens(messages, validatedModel);

    // @or Set up OpenRouter configuration
    const baseURL =
      process.env.OPENROUTER_BASE || "https://openrouter.ai/api/v1";
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OpenRouter API key not configured",
      });
    }

    console.log(`@or Making OpenRouter request for model: ${validatedModel}`);

    // @or Make request to OpenRouter
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Rivo Labs Chat",
      },
      body: JSON.stringify({
        model: validatedModel,
        messages,
        stream,
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`OpenRouter API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      // Handle specific error cases
      if (response.status === 401) {
        return res.status(401).json({ error: "Invalid API key" });
      } else if (response.status === 429) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      } else if (response.status === 500) {
        return res
          .status(500)
          .json({ error: "OpenRouter internal server error" });
      }

      return res.status(response.status).json({
        error:
          errorData?.error?.message ||
          `OpenRouter API error: ${response.statusText}`,
      });
    }

    // Handle streaming response
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const reader = response.body?.getReader();
      if (!reader) {
        return res.status(500).json({ error: "Failed to initialize stream" });
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }

      res.end();
      return;
    }

    // Handle regular response
    const result = await response.json();

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      return res.status(500).json({
        error: "Invalid response from OpenRouter",
      });
    }

    const assistantMessage = result.choices[0].message.content;

    // @or Estimate output tokens and log usage
    const outputTokens =
      result.usage?.completion_tokens || Math.ceil(assistantMessage.length / 4);
    await logUsage(userId, validatedModel, inputTokens, outputTokens);

    console.log(
      `@or OpenRouter request successful for model: ${validatedModel}`
    );

    return res.status(200).json({
      message: {
        role: "assistant",
        content: assistantMessage,
      },
      usage: {
        inputTokens: result.usage?.prompt_tokens || inputTokens,
        outputTokens: result.usage?.completion_tokens || outputTokens,
        totalTokens: result.usage?.total_tokens || inputTokens + outputTokens,
      },
    });
  } catch (error) {
    console.error("OpenRouter API error:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to process chat request",
    });
  }
}
