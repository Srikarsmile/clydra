// @fluid-ui - T3.chat model definitions with all flagship models (matching server schema)
export const MODEL_ALIASES = {
  "openai/gpt-4o": "GPT-4o",
  "google/gemini-2.5-flash-preview": "Gemini 2.5 Flash", // @fluid-ui - updated to match server
  "google/gemini-2.5-pro": "Gemini 2.5 Pro",
  "anthropic/claude-sonnet-4": "Claude 4 Sonnet", // @fluid-ui
  "anthropic/claude-opus-4": "Claude 4 Opus", // @fluid-ui
  "deepseek/deepseek-r1": "DeepSeek R1", // @fluid-ui - updated to match server
  "anthropic/claude-3-sonnet-20240229": "Claude 3 Sonnet",
  "google/gemini-1.5-pro": "Gemini 1.5 Pro",
  "anthropic/claude-3-opus-20240229": "Claude 3 Opus",
  "meta-llama/llama-3-70b-instruct": "Llama-3-70B",
} as const;

export type ChatModel = keyof typeof MODEL_ALIASES;
