// @fluid-ui - T3.chat model definitions with streamlined model selection
export const MODEL_ALIASES = {
  // Free Plan Models - using correct OpenRouter identifiers
  "google/gemini-2.5-flash-preview": "Gemini 2.5 Flash", // Default free model

  // Pro Plan Models - using correct OpenRouter identifiers
  "openai/gpt-4o": "GPT-4o",
  "anthropic/claude-3-5-sonnet-20241022": "Claude 4 Sonnet",
  "x-ai/grok-3": "Grok 3",
  "google/gemini-2.5-pro": "Gemini 2.5 Pro",
  "mistralai/Magistral-Small-2506": "Mistral Small",
  "klusterai/Meta-Llama-3.3-70B-Instruct-Turbo": "Llama 3.3 70B",
  "sarvam-m": "Sarvam M",

  // Deprecated models (kept temporarily for migration)
  "x-ai/grok-beta": "Grok Beta (Deprecated)", // Will be migrated to grok-3
  "google/gemini-2.5-pro-exp-03-25": "Gemini 2.5 Pro (Deprecated)", // Will be migrated to gemini-2.5-pro
} as const;

export type ChatModel = keyof typeof MODEL_ALIASES;

// @dashboard-redesign - Model groupings for UI organization
export const MODEL_GROUPS = {
  free: ["google/gemini-2.5-flash-preview"],
  pro: [
    "openai/gpt-4o",
    "anthropic/claude-3-5-sonnet-20241022",
    "x-ai/grok-3",
    "google/gemini-2.5-pro",
    "mistralai/Magistral-Small-2506",
    "klusterai/Meta-Llama-3.3-70B-Instruct-Turbo",
    "sarvam-m",
  ],
  legacy: [], // No legacy models in streamlined configuration
} as const;

// @dashboard-redesign - Plan-based model organization per design brief
export const FREE_PLAN_MODELS: ChatModel[] = [
  "google/gemini-2.5-flash-preview", // Default free model
];

export const PRO_PLAN_MODELS: ChatModel[] = [
  "openai/gpt-4o",
  "anthropic/claude-3-5-sonnet-20241022",
  "x-ai/grok-3",
  "google/gemini-2.5-pro",
  "mistralai/Magistral-Small-2506",
  "klusterai/Meta-Llama-3.3-70B-Instruct-Turbo",
  "sarvam-m",
];

// Model features
export const MODELS_WITH_WEB_SEARCH: ChatModel[] = [
  // Pro plan models with web search capability (only models that actually support :online in OpenRouter)
  "anthropic/claude-3-5-sonnet-20241022", // ✅ Confirmed working with :online
];

// Models with vision capabilities (can process images)
export const MODELS_WITH_VISION: ChatModel[] = [
  "mistralai/Magistral-Small-2506", // ✅ Supports vision as per Kluster AI documentation
  "openai/gpt-4o", // ✅ Supports vision
  "anthropic/claude-3-5-sonnet-20241022", // ✅ Supports vision
  "google/gemini-2.5-pro", // ✅ Supports vision
  "google/gemini-2.5-flash-preview", // ✅ Supports vision
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
