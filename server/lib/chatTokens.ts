/**
 * Chat Token Estimation Utilities
 *
 * Provides token counting functionality for different AI models
 * to implement metered quotas.
 */

// Token estimation functions
export function estimateTokens(text: string, model: string): number {
  // Basic fallback estimation (roughly 4 characters per token)
  const fallbackEstimation = Math.ceil(text.length / 4);

  try {
    switch (model) {
      case "gpt-4o":
        return estimateOpenAITokens(text, "gpt-4");
      case "claude-sonnet":
        return estimateAnthropicTokens(text);
      case "gemini-pro":
        return estimateGeminiTokens(text);
      default:
        return fallbackEstimation;
    }
  } catch (error) {
    console.warn(`Token estimation failed for model ${model}:`, error);
    return fallbackEstimation;
  }
}

function estimateOpenAITokens(text: string, model: string = "gpt-4"): number {
  // For now, using a simple estimation
  // In production, you would use: import { encoding_for_model } from 'tiktoken';
  // const encoding = encoding_for_model(model);
  // return encoding.encode(text).length;

  // Simple approximation: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

function estimateAnthropicTokens(text: string): number {
  // For now, using a simple estimation
  // In production, you would use: import { countTokens } from '@anthropic-ai/tokenizer';
  // return countTokens(text);

  // Anthropic uses a similar tokenization to OpenAI
  return Math.ceil(text.length / 4);
}

function estimateGeminiTokens(text: string): number {
  // Google's tokenization is typically more efficient
  // Using a slightly better ratio for Gemini
  return Math.ceil(text.length / 4.5);
}

export function estimateConversationTokens(
  messages: Array<{ role: string; content: string }>,
  model: string
): number {
  const totalText = messages.map((msg) => msg.content).join("\n");
  const contentTokens = estimateTokens(totalText, model);

  // Add overhead for message formatting (role indicators, etc.)
  const overheadPerMessage = 4;
  const overhead = messages.length * overheadPerMessage;

  return contentTokens + overhead;
}

// Model-specific token limits and costs
export const MODEL_CONFIGS = {
  "gpt-4o": {
    maxTokens: 128000,
    inputCostPer1kTokens: 0.0025, // $2.50 per 1M input tokens
    outputCostPer1kTokens: 0.01, // $10 per 1M output tokens
  },
  "claude-sonnet": {
    maxTokens: 200000,
    inputCostPer1kTokens: 0.003, // $3 per 1M input tokens
    outputCostPer1kTokens: 0.015, // $15 per 1M output tokens
  },
  "gemini-pro": {
    maxTokens: 128000,
    inputCostPer1kTokens: 0.0005, // $0.50 per 1M input tokens (much cheaper)
    outputCostPer1kTokens: 0.0015, // $1.50 per 1M output tokens
  },
} as const;

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: keyof typeof MODEL_CONFIGS
): number {
  const config = MODEL_CONFIGS[model];
  if (!config) return 0;

  const inputCost = (inputTokens / 1000) * config.inputCostPer1kTokens;
  const outputCost = (outputTokens / 1000) * config.outputCostPer1kTokens;

  return inputCost + outputCost;
}

export function getModelDisplayName(model: string): string {
  switch (model) {
    case "gpt-4o":
      return "GPT-4o";
    case "claude-sonnet":
      return "Claude Sonnet 3.5";
    case "gemini-pro":
      return "Gemini Pro";
    default:
      return model;
  }
}
