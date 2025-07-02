// @fluid-ui - T3.chat model definitions with latest models organized by plan
export const MODEL_ALIASES = {
  // Free Plan Models - as specified in design brief
  "google/gemini-2.5-flash": "Gemini 2.5 Flash",

  // Pro Plan Models - as specified in design brief
  "openai/gpt-4o": "GPT-4o",
  "anthropic/claude-sonnet-4": "Claude 4 Sonnet",
  "x-ai/grok-3-beta": "Grok-3 Beta",
  "google/gemini-2.5-pro": "Gemini 2.5 Pro",

  // Legacy models (kept for compatibility)
  "openai/gpt-4o-mini": "GPT-4o Mini",
  "deepseek/deepseek-r1": "DeepSeek R1",
  "google/gemini-2.5-flash-preview": "Gemini 2.5 Flash",
  "anthropic/claude-opus-4": "Claude 4 Opus",
  "anthropic/claude-3-sonnet-20240229": "Claude 3 Sonnet",
  "google/gemini-1.5-pro": "Gemini 1.5 Pro",
  "anthropic/claude-3-opus-20240229": "Claude 3 Opus",
  "meta-llama/llama-3-70b-instruct": "Llama-3-70B",
} as const;

export type ChatModel = keyof typeof MODEL_ALIASES;

// @dashboard-redesign - Plan-based model organization per design brief
export const FREE_PLAN_MODELS: ChatModel[] = [
  "google/gemini-2.5-flash", // Free model as specified
];

export const PRO_PLAN_MODELS: ChatModel[] = [
  "openai/gpt-4o",
  "anthropic/claude-sonnet-4",
  "x-ai/grok-3-beta",
  "google/gemini-2.5-pro",
];

// Model features
export const MODELS_WITH_WEB_SEARCH: ChatModel[] = [
  // Pro plan models with web search capability
  "openai/gpt-4o",
  "anthropic/claude-sonnet-4",
  "x-ai/grok-3-beta",
  "google/gemini-2.5-pro",
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
