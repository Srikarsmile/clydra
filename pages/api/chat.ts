// @or OpenRouter Chat API (REST endpoint)
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { useOpenRouter } from "../../server/lib/useOpenRouter";
import { estimateConversationTokens } from "../../server/lib/chatTokens";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  model: 
    | "openai/gpt-3.5-turbo"
    | "anthropic/claude-3-sonnet-20240229"
    | "anthropic/claude-3-opus-20240229"
    | "google/gemini-1.0-pro"
    | "mistral/mistral-large-2024-01"
    | "openai/gpt-4-turbo";
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
  console.log(`Usage logged: ${userId}, ${model}, ${inputTokens} in, ${outputTokens} out`);
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
    if (!useOpenRouter()) {
      return res.status(503).json({ 
        error: "Chat feature is not yet available" 
      });
    }

    // Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { model, messages }: ChatRequest = req.body;

    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    // Validate model
    const validModels = [
      "openai/gpt-3.5-turbo",
      "anthropic/claude-3-sonnet-20240229",
      "anthropic/claude-3-opus-20240229",
      "google/gemini-1.0-pro",
      "mistral/mistral-large-2024-01",
      "openai/gpt-4-turbo"
    ];

    if (!validModels.includes(model)) {
      return res.status(400).json({ error: "Invalid model specified" });
    }

    // @or Estimate input tokens
    const inputTokens = estimateConversationTokens(messages, model);

    // @or Set up OpenRouter configuration
    const baseURL = process.env.OPENROUTER_BASE || "https://openrouter.ai/api/v1";
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        error: "OpenRouter API key not configured" 
      });
    }

    console.log(`@or Making OpenRouter request for model: ${model}`);

    // @or Make request to OpenRouter
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Rivo Labs Chat",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error: ${response.status} ${errorText}`);
      return res.status(response.status).json({
        error: `OpenRouter API error: ${response.status} ${errorText}`,
      });
    }

    const result = await response.json();
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      return res.status(500).json({
        error: "Invalid response from OpenRouter",
      });
    }

    const assistantMessage = result.choices[0].message.content;
    
    // @or Estimate output tokens and log usage
    const outputTokens = Math.ceil(assistantMessage.length / 4);
    await logUsage(userId, model, inputTokens, outputTokens);

    console.log(`@or OpenRouter request successful for model: ${model}`);

    return res.status(200).json({
      message: {
        role: "assistant",
        content: assistantMessage,
      },
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
    });

  } catch (error) {
    console.error("OpenRouter API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to process chat request",
    });
  }
} 