/**
 * Chat Token Estimation Utilities
 *
 * Provides token counting functionality for different AI models
 * to implement metered quotas.
 */

// @or Token estimation functions for OpenRouter models
export function estimateTokens(text: string, model: string): number {
  // Basic fallback estimation (roughly 4 characters per token)
  const fallbackEstimation = Math.ceil(text.length / 4);

  try {
    switch (model) {
      case "openai/gpt-3.5-turbo":
      case "openai/gpt-4-turbo":
        return estimateOpenAITokens(text);
      case "anthropic/claude-3-sonnet-20240229":
      case "anthropic/claude-3-opus-20240229":
        return estimateAnthropicTokens(text);
      case "google/gemini-1.0-pro":
        return estimateGeminiTokens(text);
      case "mistral/mistral-large-2024-01":
        return estimateMistralTokens(text);
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

function estimateMistralTokens(text: string): number {
  // Assuming a simple estimation based on the length of the text
  return Math.ceil(text.length / 4);
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

// @or Model-specific token limits and costs for OpenRouter models
export const MODEL_CONFIGS = {
  "openai/gpt-3.5-turbo": {
    maxTokens: 16385,
    inputCostPer1kTokens: 0.0005, // $0.50 per 1M input tokens
    outputCostPer1kTokens: 0.0015, // $1.50 per 1M output tokens
  },
  "anthropic/claude-3-sonnet-20240229": {
    maxTokens: 200000,
    inputCostPer1kTokens: 0.003, // $3 per 1M input tokens
    outputCostPer1kTokens: 0.015, // $15 per 1M output tokens
  },
  "anthropic/claude-3-opus-20240229": {
    maxTokens: 200000,
    inputCostPer1kTokens: 0.006, // $6 per 1M input tokens
    outputCostPer1kTokens: 0.025, // $25 per 1M output tokens
  },
  "google/gemini-1.0-pro": {
    maxTokens: 128000,
    inputCostPer1kTokens: 0.0005, // $0.50 per 1M input tokens
    outputCostPer1kTokens: 0.0015, // $1.50 per 1M output tokens
  },
  "mistral/mistral-large-2024-01": {
    maxTokens: 32768,
    inputCostPer1kTokens: 0.002, // $2 per 1M input tokens
    outputCostPer1kTokens: 0.008, // $8 per 1M output tokens
  },
  "openai/gpt-4-turbo": {
    maxTokens: 128000,
    inputCostPer1kTokens: 0.003, // $3 per 1M input tokens
    outputCostPer1kTokens: 0.01, // $10 per 1M output tokens
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

// @or Get display name for OpenRouter models
export function getModelDisplayName(model: string): string {
  switch (model) {
    case "openai/gpt-3.5-turbo":
      return "GPT-3.5 Turbo";
    case "anthropic/claude-3-sonnet-20240229":
      return "Claude 3 Sonnet";
    case "anthropic/claude-3-opus-20240229":
      return "Claude 3 Opus";
    case "google/gemini-1.0-pro":
      return "Gemini Pro";
    case "mistral/mistral-large-2024-01":
      return "Mistral Large";
    case "openai/gpt-4-turbo":
      return "GPT-4 Turbo";
    default:
      return model;
  }
}
