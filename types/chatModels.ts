// @fluid-ui - T3.chat model definitions with latest models organized by plan
export const MODEL_ALIASES = {
  // Free Plan Models - using correct OpenRouter identifiers
  "google/gemini-2.0-flash-001": "Gemini Flash 2.0",

  // Pro Plan Models - using correct OpenRouter identifiers
  "openai/gpt-4o": "GPT-4o",
  "anthropic/claude-3.5-sonnet": "Claude 3.5 Sonnet",
  "x-ai/grok-beta": "Grok Beta",
  "google/gemini-2.5-pro-exp-03-25": "Gemini 2.5 Pro",

  // Legacy models (kept for compatibility)
  "openai/gpt-4o-mini": "GPT-4o Mini",
  "deepseek/deepseek-r1": "DeepSeek R1",
  "google/gemini-2.5-flash-preview": "Gemini 2.5 Flash Preview",
  "anthropic/claude-3-opus-20240229": "Claude 3 Opus",
  "anthropic/claude-3-sonnet-20240229": "Claude 3 Sonnet",
  "google/gemini-1.5-pro": "Gemini 1.5 Pro",
  "meta-llama/llama-3-70b-instruct": "Llama-3-70B",
} as const;

export type ChatModel = keyof typeof MODEL_ALIASES;

// @dashboard-redesign - Plan-based model organization per design brief
export const FREE_PLAN_MODELS: ChatModel[] = [
  "google/gemini-2.0-flash-001", // Free model with correct identifier
];

export const PRO_PLAN_MODELS: ChatModel[] = [
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet", // Fixed to use correct identifier
  "x-ai/grok-beta", // Fixed to use correct identifier
  "google/gemini-2.5-pro-exp-03-25", // Fixed to use correct identifier
];

// Model features
export const MODELS_WITH_WEB_SEARCH: ChatModel[] = [
  // Pro plan models with web search capability
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet",
  "x-ai/grok-beta",
  "google/gemini-2.5-pro-exp-03-25",
];

export function getModelsByPlan(plan: "free" | "pro" | "max"): ChatModel[] {
  switch (plan) {
    case "free":
      return FREE_PLAN_MODELS;
    case "pro":
    case "max":
      return [...FREE_PLAN_MODELS, ...PRO_PLAN_MODELS];
    default:
      return FREE_PLAN_MODELS;
  }
}

export function modelSupportsWebSearch(model: ChatModel): boolean {
  return MODELS_WITH_WEB_SEARCH.includes(model);
}
