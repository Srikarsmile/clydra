// @or OpenRouter Chat API with Web Search capability
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { estimateConversationTokens } from "../../server/lib/chatTokens";
import {
  MODEL_ALIASES,
  ChatModel,
  modelSupportsWebSearch,
} from "../../types/chatModels";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  model: ChatModel;
  messages: ChatMessage[];
  enableWebSearch?: boolean;
}

// Validate required environment variables
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openRouterApiKey) {
  throw new Error("Missing environment variable: OPENROUTER_API_KEY");
}

// Initialize OpenAI client with OpenRouter
const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: openRouterApiKey,
});

// Web search function using SerpAPI or similar
async function performWebSearch(query: string): Promise<string> {
  try {
    // For now, return a placeholder. In production, integrate with SerpAPI, Tavily, or similar
    return `Recent web search results for "${query}": [Web search functionality will be implemented with SerpAPI integration]`;
  } catch (error) {
    console.error("Web search error:", error);
    return "Web search temporarily unavailable.";
  }
}

// @or Stub helper for usage logging
async function logUsage(): Promise<void> {
  // Usage is logged via the main chat API endpoint
  // This function is kept for legacy compatibility
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
      enableWebSearch = false,
      stream = false,
    }: ChatRequest & { stream?: boolean } = req.body;

    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    // Validate incoming model
    const validatedModel: ChatModel = MODEL_ALIASES[model]
      ? model
      : "google/gemini-2.5-flash-preview";

    // Check if web search is enabled and model supports it
    const shouldUseWebSearch =
      enableWebSearch && modelSupportsWebSearch(validatedModel);

    // @or Estimate input tokens
    let enhancedMessages = [...messages];

    // If web search is enabled, perform search based on the latest user message
    if (shouldUseWebSearch && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === "user") {
        const searchResults = await performWebSearch(lastUserMessage.content);

        // Add web search context to the conversation
        enhancedMessages = [
          ...messages.slice(0, -1),
          {
            role: "system",
            content: `You have access to current web search results. Here are recent search results relevant to the user's query: ${searchResults}. Use this information to provide more accurate and up-to-date responses.`,
          },
          lastUserMessage,
        ];
      }
    }

    const inputTokens = estimateConversationTokens(
      enhancedMessages,
      validatedModel
    );

    // API key validation is now handled at module level

    try {
      // @or Make request using OpenAI client with OpenRouter
      if (stream) {
        const completion = await openRouterClient.chat.completions.create(
          {
            model: validatedModel,
            messages: enhancedMessages,
            stream: true,
            temperature: 0.7,
            max_tokens: 4000,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
          },
          {
            headers: {
              "HTTP-Referer":
                process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
              "X-Title": "Clydra Chat",
            },
          }
        );

        // Handle streaming response
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // Stream the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        res.write("data: [DONE]\n\n");
        res.end();
        return;
      } else {
        const completion = await openRouterClient.chat.completions.create(
          {
            model: validatedModel,
            messages: enhancedMessages,
            stream: false,
            temperature: 0.7,
            max_tokens: 4000,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
          },
          {
            headers: {
              "HTTP-Referer":
                process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
              "X-Title": "Clydra Chat",
            },
          }
        );

        // Handle regular response
        if (
          !completion.choices ||
          !completion.choices[0] ||
          !completion.choices[0].message
        ) {
          return res.status(500).json({
            error: "Invalid response from OpenRouter",
          });
        }

        const assistantMessage = completion.choices[0].message.content;

        // @or Estimate output tokens and log usage
        const outputTokens =
          completion.usage?.completion_tokens ||
          Math.ceil((assistantMessage?.length || 0) / 4);
        await logUsage();

        return res.status(200).json({
          message: {
            role: "assistant",
            content: assistantMessage,
          },
          usage: {
            inputTokens: completion.usage?.prompt_tokens || inputTokens,
            outputTokens: completion.usage?.completion_tokens || outputTokens,
            totalTokens:
              completion.usage?.total_tokens || inputTokens + outputTokens,
          },
          webSearchUsed: shouldUseWebSearch,
        });
      }
    } catch (openAIError: unknown) {
      console.error("OpenAI/OpenRouter API error:", openAIError);

      // Handle specific error cases
      if (
        openAIError &&
        typeof openAIError === "object" &&
        "status" in openAIError
      ) {
        const errorWithStatus = openAIError as {
          status?: number;
          message?: string;
        };
        if (errorWithStatus.status === 401) {
          return res.status(401).json({ error: "Invalid API key" });
        } else if (errorWithStatus.status === 429) {
          return res.status(429).json({ error: "Rate limit exceeded" });
        } else if (errorWithStatus.status === 500) {
          return res
            .status(500)
            .json({ error: "OpenRouter internal server error" });
        }

        return res.status(errorWithStatus.status || 500).json({
          error: errorWithStatus.message || "OpenRouter API error",
        });
      }

      return res.status(500).json({
        error: "OpenRouter API error",
      });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to process chat request",
    });
  }
}
