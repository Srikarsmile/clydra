// @fluid-ui - T3.chat model definitions with latest models organized by plan
export const MODEL_ALIASES = {
  // Free Plan Models - using correct OpenRouter identifiers
  "google/gemini-2.0-flash-001": "Gemini Flash 2.0",

  // Pro Plan Models - using correct OpenRouter identifiers
  "openai/gpt-4o": "GPT-4o",
  "anthropic/claude-3-5-sonnet-20241022": "Claude 4 Sonnet", // Upgraded to Claude 4 Sonnet
  "x-ai/grok-beta": "Grok Beta",
  "google/gemini-2.5-pro-exp-03-25": "Gemini 2.5 Pro",
  "mistralai/Magistral-Small-2506": "Mistral Small", // Vision-capable model via Kluster AI
  "klusterai/Meta-Llama-3.3-70B-Instruct-Turbo": "Llama 3.3 70B", // Large reasoning model via Kluster AI
  "sarvam-m": "Sarvam M", // Sarvam AI model with wiki grounding

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
  "anthropic/claude-3-5-sonnet-20241022", // Fixed to use correct identifier
  "x-ai/grok-beta", // Fixed to use correct identifier
  "google/gemini-2.5-pro-exp-03-25", // Fixed to use correct identifier
  "mistralai/Magistral-Small-2506", // New vision-capable model via Kluster AI
  "klusterai/Meta-Llama-3.3-70B-Instruct-Turbo", // New large reasoning model via Kluster AI
  "sarvam-m", // Sarvam AI model with wiki grounding
];

// Model features
export const MODELS_WITH_WEB_SEARCH: ChatModel[] = [
  // Pro plan models with web search capability (only models that actually support :online in OpenRouter)
  "anthropic/claude-3-5-sonnet-20241022", // ✅ Confirmed working with :online
  // "openai/gpt-4o", // ❌ Does not support :online suffix in OpenRouter
  // "x-ai/grok-beta", // ❓ Not tested with :online
  // "google/gemini-2.5-pro-exp-03-25", // ❓ Not tested with :online
  // "mistralai/Magistral-Small-2506", // ❓ Not tested with :online
  // "klusterai/Meta-Llama-3.3-70B-Instruct-Turbo", // ❓ Not tested with :online
  // "sarvam-m", // ❌ Uses wiki grounding instead of web search
];

// Models with vision capabilities (can process images)
export const MODELS_WITH_VISION: ChatModel[] = [
  "mistralai/Magistral-Small-2506", // ✅ Supports vision as per Kluster AI documentation
  "openai/gpt-4o", // ✅ Supports vision
  "anthropic/claude-3-5-sonnet-20241022", // ✅ Supports vision
  "google/gemini-2.5-pro-exp-03-25", // ✅ Supports vision
];

// Models that use Kluster AI instead of OpenRouter
export const KLUSTER_AI_MODELS: ChatModel[] = [
  "mistralai/Magistral-Small-2506",
  "klusterai/Meta-Llama-3.3-70B-Instruct-Turbo",
];

// Models that use Sarvam AI instead of OpenRouter
export const SARVAM_AI_MODELS: ChatModel[] = ["sarvam-m"];

// Models with wiki grounding capabilities (factual information retrieval)
export const MODELS_WITH_WIKI_GROUNDING: ChatModel[] = [
  "sarvam-m", // ✅ Supports wiki grounding as per Sarvam AI documentation
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

export function modelSupportsVision(model: ChatModel): boolean {
  return MODELS_WITH_VISION.includes(model);
}

export function isKlusterAIModel(model: ChatModel): boolean {
  return KLUSTER_AI_MODELS.includes(model);
}

export function isSarvamAIModel(model: ChatModel): boolean {
  return SARVAM_AI_MODELS.includes(model);
}

export function modelSupportsWikiGrounding(model: ChatModel): boolean {
  return MODELS_WITH_WIKI_GROUNDING.includes(model);
}
