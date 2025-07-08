/**
 * @clydra-core
 * Convo Core - Chat API Utilities
 *
 * Provides chat functionality via OpenRouter with token usage tracking
 * and daily message limits for the Free tier.
 */

import { z } from "zod";
import OpenAI from "openai";
import { useOpenRouter } from "../lib/useOpenRouter";
import { estimateConversationTokens } from "../lib/chatTokens";
import { updateUsageMeter } from "../lib/usage";
import {
  getRemainingDailyTokens,
  consumeDailyTokens,
} from "../lib/grantDailyTokens"; // @grant-40k
import { addTokens } from "../lib/tokens"; // @model-multiplier - Import token tracking with multipliers
import {
  computeEffectiveTokens,
  MODEL_MULTIPLIER,
  WEB_SEARCH_MULTIPLIER,
} from "../lib/tokens"; // @margin-patch - Import token multiplier system
import { supabaseAdmin } from "../../lib/supabase";
import { getOrCreateUser } from "../../lib/user-utils";
import {
  MODEL_ALIASES,
  ChatModel,
  MODELS_WITH_WEB_SEARCH,
  isKlusterAIModel,
  isSarvamAIModel,
  modelSupportsWikiGrounding,
} from "../../types/chatModels";

// @performance - Add response caching
const responseCache = new Map<string, {
  response: string;
  timestamp: number;
  expiresAt: number;
}>();

// @performance - Cache cleanup interval - reduced for better performance
const CACHE_CLEANUP_INTERVAL = 2 * 60 * 1000; // 2 minutes
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// @performance - Clean up expired cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (now > entry.expiresAt) {
      responseCache.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

// @dashboard-redesign - Updated input validation schema to match frontend models
const chatInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ),
  model: z
    .enum([
      // Streamlined model selection - only 7 models (removed verify-reliability)
      "google/gemini-2.5-flash-preview", // Default free model
      "openai/gpt-4o",
      "anthropic/claude-sonnet-4", // Updated to new Claude 4 model ID
      "x-ai/grok-3",
      "google/gemini-2.5-pro",
      "mistralai/magistral-small-2506",
      "klusterai/meta-llama-3.3-70b-instruct-turbo",
      "sarvam-m",
      // Deprecated models (temporarily allowed for migration)
      "x-ai/grok-beta", // Will be migrated to x-ai/grok-3
      "google/gemini-2.5-pro-exp-03-25", // Will be migrated to google/gemini-2.5-pro
      "anthropic/claude-3-5-sonnet-20241022", // Will be migrated to anthropic/claude-sonnet-4
    ])
    .describe("Model to use for chat completion"),
  threadId: z.string().optional(),
  enableWebSearch: z.boolean().optional().default(false), // @web-search - Add web search parameter
  webSearchContextSize: z
    .enum(["low", "medium", "high"])
    .optional()
    .default("medium"), // @web-search - Add context size parameter
  enableWikiGrounding: z.boolean().optional().default(false), // @sarvam - Add wiki grounding parameter
});

export type ChatInput = z.infer<typeof chatInputSchema>;

export interface ChatResponse {
  message: {
    role: "assistant";
    content: string;
    id?: string; // @multi-model - Use string ID from Supabase
    annotations?: Array<{
      type: "url_citation";
      url_citation: {
        url: string;
        title: string;
        content?: string;
        start_index: number;
        end_index: number;
      };
    }>; // @web-search - Add OpenRouter citation annotations
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  webSearchUsed?: boolean; // @web-search - Indicate if web search was used
  timing?: {
    openRouterDuration: number; // @performance - Add timing information
  };
}

// Add streaming response interface
export interface StreamingChatResponse {
  stream: ReadableStream;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export class ChatError extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ChatError";
  }
}

// @performance - Generate cache key for responses
function generateCacheKey(
  userId: string,
  model: ChatModel,
  messages: Array<{ role: string; content: string }>,
  enableWebSearch: boolean,
  enableWikiGrounding: boolean
): string {
  const messageContent = messages.map(m => `${m.role}:${m.content}`).join('|');
  return `${userId}:${model}:${messageContent}:${enableWebSearch}:${enableWikiGrounding}`;
}

/**
 * @clydra-core Process chat request with OpenRouter
 * @threads - Updated to support threadId for message persistence
 * @performance - Added streaming support for reduced latency
 */
export async function processChatRequest(
  clerkUserId: string, // Clerk user ID from auth
  input: ChatInput,
  threadId?: string, // @threads - Add threadId parameter
  enableStreaming?: boolean // @performance - Add streaming option
): Promise<ChatResponse | StreamingChatResponse> {
  // Convert Clerk ID to Supabase UUID
  let userResult;
  try {
    userResult = await getOrCreateUser(clerkUserId);
  } catch (error) {
    console.error("getOrCreateUser failed:", error);
    throw new ChatError(
      "INTERNAL_SERVER_ERROR",
      "User lookup failed"
    );
  }
  
  if (!userResult.success || !userResult.user) {
    throw new ChatError(
      "UNAUTHORIZED",
      "User not found or could not be created"
    );
  }
  const userId = userResult.user.id; // Now we have the Supabase UUID

  // @clydra-core Validate input
  const validatedInput = chatInputSchema.parse(input);

  // @fix-deprecated-models - Handle deprecated model names from cached frontend state
  const modelMigrationMap: Record<string, ChatModel> = {
    "x-ai/grok-beta": "x-ai/grok-3",
    "google/gemini-2.5-pro-exp-03-25": "google/gemini-2.5-pro",
    // Migration for removed models to appropriate alternatives
    "openai/gpt-4o-mini": "openai/gpt-4o",
    "deepseek/deepseek-r1": "google/gemini-2.5-flash-preview",
    "anthropic/claude-3-opus-20240229": "anthropic/claude-sonnet-4",
    "anthropic/claude-3-sonnet-20240229": "anthropic/claude-sonnet-4",
    "anthropic/claude-3-5-sonnet-20241022": "anthropic/claude-sonnet-4", // Migrate old Claude ID
    "meta-llama/llama-3-70b-instruct":
      "klusterai/meta-llama-3.3-70b-instruct-turbo",
    // Google model migrations
    "google/gemini-2.5-flash": "google/gemini-2.5-flash-preview",
    "google/gemini-2.0-flash-001": "google/gemini-2.5-flash-preview",
    "google/gemini-2.5-flash-preview-05-20": "google/gemini-2.5-flash-preview",
    "google/gemini-1.5-pro": "google/gemini-2.5-pro",
    // Fix for direct model access
    "mistralai/mistral-small-3.2-24b-instruct": "mistralai/magistral-small-2506",
    "mistralai/mistral-small-latest": "mistralai/magistral-small-2506",
    "meta-llama/llama-3.3-70b-instruct:free": "klusterai/meta-llama-3.3-70b-instruct-turbo",
    "shisa-ai/shisa-v2-llama3.3-70b:free": "klusterai/meta-llama-3.3-70b-instruct-turbo",
    "qwen/qwen-2.5-7b-instruct": "sarvam-m",
  };

  // @clydra-core Validate incoming model against MODEL_ALIASES
  let requestedModel = validatedInput.model as ChatModel;

  // Apply migration if needed
  if (modelMigrationMap[requestedModel]) {
    console.log(
      `🔄 Migrating deprecated model: ${requestedModel} → ${modelMigrationMap[requestedModel]}`
    );
    requestedModel = modelMigrationMap[requestedModel];
  }

  const model: ChatModel = MODEL_ALIASES[requestedModel]
    ? requestedModel
    : "google/gemini-2.5-flash-preview"; // Default to Google Flash model

  // @web-search - Check if web search should be enabled (only for supported models)
  const shouldUseWebSearch =
    validatedInput.enableWebSearch &&
    MODELS_WITH_WEB_SEARCH.includes(model) &&
    model === "anthropic/claude-3-5-sonnet-20241022"; // Only enable for models that actually support :online

  // @sarvam - Check if wiki grounding should be enabled (only for supported models)
  const shouldUseWikiGrounding =
    validatedInput.enableWikiGrounding &&
    modelSupportsWikiGrounding(model) &&
    isSarvamAIModel(model); // Only enable for Sarvam AI models

  // @performance - Check cache for non-streaming requests
  if (!enableStreaming) {
    const cacheKey = generateCacheKey(
      userId,
      model,
      validatedInput.messages,
      shouldUseWebSearch,
      shouldUseWikiGrounding
    );
    
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse && Date.now() < cachedResponse.expiresAt) {
      console.log(`📦 Cache hit for user ${userId}`);
      return {
        message: {
          role: "assistant",
          content: cachedResponse.response,
        },
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
        timing: {
          openRouterDuration: 0,
        },
      };
    }
  }

  // @web-search - Prepare the model string for OpenRouter (append :online for web search)
  const openRouterModel = shouldUseWebSearch ? `${model}:online` : model;

  // @clydra-core Guard behind feature flag
  if (!useOpenRouter()) {
    throw new ChatError(
      "SERVICE_UNAVAILABLE",
      "Chat feature is not yet available. Please set NEXT_PUBLIC_USE_OPENROUTER=true in your environment."
    );
  }

  // @clydra-core Estimate input tokens
  let inputTokens: number;
  try {
    inputTokens = estimateConversationTokens(
      validatedInput.messages,
      model
    );
  } catch (error) {
    console.error("Token estimation error:", error);
    // Fallback estimation
    inputTokens = Math.ceil(
      validatedInput.messages.map(m => m.content).join(' ').length / 4
    );
  }

  // @grant-80k - Check daily token quota (primary limit)
  let remainingTokens: number;
  try {
    remainingTokens = await getRemainingDailyTokens(userId);
  } catch (error) {
    console.error("Daily tokens check error:", error);
    // Fail open - allow the request to proceed
    remainingTokens = inputTokens + 1000;
  }

  if (remainingTokens < inputTokens) {
    throw new ChatError(
      "FORBIDDEN",
      `Insufficient daily tokens. Need ${inputTokens}, have ${remainingTokens}.`
    );
  }

  // Note: Removed legacy daily message limit check in favor of token-based system
  // The token system (80K daily) is more sophisticated and should be the primary limit

  // @clydra-core Set up OpenAI client - support multiple providers
  const isKlusterModel = isKlusterAIModel(model);
  const isSarvamModel = isSarvamAIModel(model);

  let baseURL: string;
  let apiKey: string | undefined;
  let defaultHeaders: Record<string, string> = {};
  let providerName: string;

  if (isKlusterModel) {
    // Use Kluster AI for Kluster models
    const klusterApiKey = process.env.KLUSTER_API_KEY;
    
    if (!klusterApiKey) {
      throw new ChatError("INTERNAL_SERVER_ERROR", "Kluster AI API key not configured");
    }
    
    baseURL = "https://api.kluster.ai/v1";
    apiKey = klusterApiKey;
    providerName = "Kluster AI";
    
    // Use the model as-is for Kluster AI
    requestedModel = model as ChatModel;
  } else if (isSarvamModel) {
    // Use Sarvam AI API directly
    const sarvamApiKey = process.env.SARVAM_API_KEY;
    
    if (!sarvamApiKey) {
      throw new ChatError("INTERNAL_SERVER_ERROR", "Sarvam AI API key not configured");
    }
    
    baseURL = "https://api.sarvam.ai/v1";
    apiKey = sarvamApiKey;
    providerName = "Sarvam AI";
    
    // Use the model as-is for Sarvam AI
    requestedModel = model as ChatModel;
  } else {
    // Use OpenRouter configuration
    baseURL = process.env.OPENROUTER_BASE || "https://openrouter.ai/api/v1";
    apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error("Missing environment variable: OPENROUTER_API_KEY");
    }
    
    defaultHeaders = {
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Clydra Chat",
    };
    providerName = "OpenRouter";
  }

  if (!apiKey) {
    throw new ChatError(
      "INTERNAL_SERVER_ERROR",
      `${providerName} API key not configured. Please set the appropriate API key in your environment.`
    );
  }

  // @performance - Optimized timeout settings for faster responses
  const timeout = 8000; // Reduced to 8 seconds for faster responses
  
  // Create OpenAI client with special handling for Sarvam AI
  const openai = new OpenAI({
    baseURL,
    apiKey: isSarvamModel ? "sk-dummy" : apiKey, // Dummy key for Sarvam to prevent auth errors
    defaultHeaders: {
      ...defaultHeaders,
      // Add Sarvam-specific headers
      ...(isSarvamModel ? {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json'
      } : {})
    },
    // @performance - Optimize connection settings
    timeout: timeout,
    maxRetries: 0, // No retries for faster responses
    // Custom fetch for Sarvam to handle auth properly
    ...(isSarvamModel ? {
      fetch: async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const headers = new Headers(init?.headers);
        // Remove any Authorization header for Sarvam
        headers.delete('Authorization');
        // Ensure Sarvam's required header is present
        headers.set('api-subscription-key', apiKey);
        headers.set('Content-Type', 'application/json');
        
        const newInit = {
          ...init,
          headers: headers,
        };
        
        return fetch(input, newInit);
      }
    } : {})
  });

  try {
    // @performance - Streaming vs Non-streaming logic
    if (enableStreaming) {
      // @margin-patch - Calculate effective tokens with model multiplier
      let effectiveInputTokens: number;
      try {
        effectiveInputTokens = await computeEffectiveTokens(
          model,
          inputTokens,
          shouldUseWebSearch
        );
      } catch (error) {
        console.error("Effective tokens calculation error:", error);
        // Fallback - use input tokens directly
        effectiveInputTokens = inputTokens;
      }

      // @performance - Optimized streaming implementation
      // Note: We'll consume all tokens at the end to avoid double consumption

      // @debug - Log request details before API call
      console.log(`🔍 ${providerName} API Call Details:`, {
        model: isKlusterModel || isSarvamModel ? model : openRouterModel,
        originalModel: model,
        provider: providerName,
        shouldUseWebSearch:
          isKlusterModel || isSarvamModel ? false : shouldUseWebSearch, // Only OpenRouter supports web search
        shouldUseWikiGrounding: isSarvamModel ? shouldUseWikiGrounding : false, // Only Sarvam AI supports wiki grounding
        messagesCount: validatedInput.messages.length,
        temperature: 0.7,
        max_tokens: 1500, // Reduced for faster responses
        stream: true,
      });

      const completion = await openai.chat.completions.create({
        model: requestedModel || openRouterModel, // Always use the mapped model name
        messages: validatedInput.messages,
        // @performance - Optimized parameters for lower latency
        temperature: 0.7, // Balanced for speed and quality
        max_tokens: 1000, // Reduced for faster completion
        top_p: 0.9, // More focused sampling
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: true,
        // @web-search - Add web search options for compatible models (OpenRouter only)
        ...(!isKlusterModel &&
          !isSarvamModel &&
          shouldUseWebSearch && {
            web_search_options: {
              search_context_size: validatedInput.webSearchContextSize,
            },
          }),
        // @sarvam - Add wiki grounding for Sarvam AI models
        ...(isSarvamModel &&
          shouldUseWikiGrounding && {
            wiki_grounding: true,
          }),
      });

      let fullMessage = "";
      let totalTokens = 0;

      // Create a readable stream to pipe the response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                fullMessage += content;
                // Send chunk to client immediately
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({ content })}\n\n`
                  )
                );

                // Skip intermediate saves for performance - we'll save once at the end
                // @performance - Reduce chunk processing overhead
              }

              // Track token usage from the stream
              if (chunk.usage) {
                totalTokens = chunk.usage.total_tokens || totalTokens;
              }
            }

            // Calculate and consume ALL tokens (input + output) at once
            if (fullMessage && fullMessage.length > 0) {
              const outputTokens = Math.ceil(fullMessage.length / 4); // Rough estimate
              const totalTokens = inputTokens + outputTokens;
              
              // Calculate effective tokens for daily consumption
              let effectiveTotalTokens: number;
              try {
                effectiveTotalTokens = await computeEffectiveTokens(
                  model,
                  totalTokens,
                  shouldUseWebSearch
                );
              } catch (error) {
                console.error("Effective tokens calculation error:", error);
                effectiveTotalTokens = totalTokens;
              }

              try {
                await Promise.all([
                  consumeDailyTokens(userId, effectiveTotalTokens).catch(err => {
                    console.error("Daily token consumption failed:", err);
                  }),
                  updateUsageMeter(userId, totalTokens).catch(err => {
                    console.error("Usage meter update failed:", err);
                  }),
                  // @model-multiplier - Track effective tokens with model multipliers and web search cost
                  addTokens(
                    userId,
                    totalTokens,
                    model,
                    shouldUseWebSearch
                  ).catch(err => {
                    console.error("Token tracking failed:", err);
                  }),
                ]);
              } catch (error) {
                console.error("Token processing failed:", error);
                // Don't throw - continue with the chat response
              }
            }

            // Save final message and get database ID
            let finalMessageId: string | undefined;
            if ((threadId || input.threadId) && fullMessage && fullMessage.length > 0) {
              try {
                console.log(
                  `💾 Saving final message to database for thread: ${threadId || input.threadId}`
                );
                const { assistantMessageId } = await saveMessagesToThread(
                  userId,
                  threadId || input.threadId!,
                  validatedInput.messages,
                  fullMessage,
                  model // Pass model information for streaming
                );
                finalMessageId = assistantMessageId;
                console.log(
                  `✅ Final message saved with ID: ${finalMessageId}`
                );
              } catch (error) {
                console.error("❌ Final save failed:", error);
                // Don't throw - continue with the response
              }
            }

            // Send completion message with ID
            if (finalMessageId) {
              console.log(
                `📤 Sending completion message with ID: ${finalMessageId}`
              );
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ messageId: finalMessageId, type: "completion" })}\n\n`
                )
              );
            } else {
              console.log("⚠️ No final message ID available for completion");
            }

            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("Streaming completion error:", error);
            controller.error(error);
          }
        },
      });

      return { stream };
    } else {
      // @clydra-core Non-streaming implementation (legacy)
      const t0 = performance.now();

      // @debug - Log request details before API call
      console.log(`🔍 ${providerName} API Call Details (non-streaming):`, {
        model: isKlusterModel || isSarvamModel ? model : openRouterModel,
        originalModel: model,
        provider: providerName,
        shouldUseWebSearch:
          isKlusterModel || isSarvamModel ? false : shouldUseWebSearch,
        shouldUseWikiGrounding: isSarvamModel ? shouldUseWikiGrounding : false,
        messagesCount: validatedInput.messages.length,
        temperature: 0.5,
        max_tokens: 2000, // Reduced for faster responses
        stream: false,
      });

      const completion = await openai.chat.completions.create({
        model: requestedModel || openRouterModel, // Always use the mapped model name
        messages: validatedInput.messages,
        // @performance - Optimized parameters for lower latency
        temperature: 0.5, // Reduced for faster, more focused responses
        max_tokens: 1500, // Reduced for faster completion
        top_p: 0.9, // More focused sampling for speed
        frequency_penalty: 0,
        presence_penalty: 0,
        // @web-search - Add web search options for compatible models (OpenRouter only)
        ...(!isKlusterModel &&
          !isSarvamModel &&
          shouldUseWebSearch && {
            web_search_options: {
              search_context_size: validatedInput.webSearchContextSize,
            },
          }),
        // @sarvam - Add wiki grounding for Sarvam AI models
        ...(isSarvamModel &&
          shouldUseWikiGrounding && {
            wiki_grounding: true,
          }),
      });
      const t1 = performance.now();

      if (!completion.choices[0]?.message?.content) {
        throw new ChatError(
          "INTERNAL_SERVER_ERROR",
          "Invalid response from AI provider"
        );
      }

      const assistantMessage = completion.choices[0].message.content;

      // @performance - Cache the response
      const cacheKey = generateCacheKey(
        userId,
        model,
        validatedInput.messages,
        shouldUseWebSearch,
        shouldUseWikiGrounding
      );
      
      responseCache.set(cacheKey, {
        response: assistantMessage,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_TTL,
      });

      // @clydra-core Calculate token usage and costs
      const outputTokens =
        completion.usage?.completion_tokens ||
        Math.ceil(assistantMessage.length / 4);
      const totalTokens = inputTokens + outputTokens;

      // @margin-patch - Calculate effective tokens with model multiplier
      let effectiveTotalTokens: number;
      try {
        effectiveTotalTokens = await computeEffectiveTokens(
          model,
          completion.usage?.total_tokens || totalTokens,
          shouldUseWebSearch
        );
      } catch (error) {
        console.error("Effective tokens calculation error:", error);
        // Fallback - use total tokens directly
        effectiveTotalTokens = completion.usage?.total_tokens || totalTokens;
      }

      // Log token calculation for debugging
      console.log(
        `Token calculation: ${completion.usage?.total_tokens || totalTokens} × ${MODEL_MULTIPLIER[model] || 1.0} (model) × ${shouldUseWebSearch ? WEB_SEARCH_MULTIPLIER : 1.0} (web search) = ${effectiveTotalTokens}`
      );

      // @grant-40k - Consume daily tokens and update usage meter
      try {
        await Promise.all([
          consumeDailyTokens(userId, effectiveTotalTokens).catch(err => {
            console.error("Daily token consumption failed:", err);
          }),
          updateUsageMeter(userId, totalTokens).catch(err => {
            console.error("Usage meter update failed:", err);
          }),
          // @model-multiplier - Track effective tokens with model multipliers and web search cost
          addTokens(userId, effectiveTotalTokens, model, shouldUseWebSearch).catch(err => {
            console.error("Token tracking failed:", err);
          }),
        ]);
      } catch (error) {
        console.error("Token processing failed:", error);
        // Don't throw - continue with the chat response
      }

      // @multi-model - Save chat and get message IDs
      let messageId: string | undefined;
      if (threadId || input.threadId) {
        try {
          const { assistantMessageId } = await saveMessagesToThread(
            userId,
            threadId || input.threadId!,
            validatedInput.messages,
            assistantMessage,
            model // Pass model information
          );
          messageId = assistantMessageId;
        } catch (error) {
          console.error("Failed to save messages to thread:", error);
          // Don't throw - continue with the chat response
        }
      }

      return {
        message: {
          role: "assistant",
          content: assistantMessage,
          id: messageId,
        },
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
        },
        webSearchUsed: shouldUseWebSearch,
        timing: {
          openRouterDuration: t1 - t0,
        },
      };
    }
  } catch (error) {
    console.error(`${providerName} API error:`, error);

    // @performance - Determine the appropriate error provider name
    const errorProviderName = isSarvamAIModel(model)
      ? "Sarvam AI"
      : isKlusterAIModel(model)
      ? "Kluster AI"
      : "OpenRouter";

    if (error instanceof Error) {
      // Handle specific API errors
      if (error.message.includes("timeout")) {
        throw new ChatError(
          "SERVICE_UNAVAILABLE",
          `${errorProviderName} API timeout. Please try again.`
        );
      }
      
      if (error.message.includes("rate limit")) {
        throw new ChatError(
          "TOO_MANY_REQUESTS",
          `${errorProviderName} rate limit exceeded. Please try again later.`
        );
      }
      
      if (error.message.includes("quota")) {
        throw new ChatError(
          "FORBIDDEN",
          `${errorProviderName} quota exceeded. Please try again later.`
        );
      }
      
      if (error.message.includes("401") || error.message.includes("unauthorized")) {
        throw new ChatError(
          "UNAUTHORIZED",
          `${errorProviderName} API key is invalid or expired.`
        );
      }

      throw new ChatError(
        "INTERNAL_SERVER_ERROR",
        `${errorProviderName} API error: ${error.message}`
      );
    }

    throw new ChatError(
      "INTERNAL_SERVER_ERROR",
      `${errorProviderName} API request failed unexpectedly.`
    );
  }
}

// @threads - Helper function to save messages to thread
async function saveMessagesToThread(
  userId: string, // Now expects Supabase UUID
  threadId: string,
  userMessages: Array<{ role: string; content: string }>,
  assistantResponse: string,
  model?: string // Add model parameter to save model information
): Promise<{ userMessageId?: string; assistantMessageId?: string }> {
  try {
    // userId is already a Supabase UUID, no need to convert

    // Get the last user message
    const lastUserMessage = userMessages[userMessages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== "user") {
      throw new Error("Invalid message format");
    }

    console.log("Checking existing messages for thread:", threadId);

    // @fix-foreign-key - First, ensure the thread exists
    const { data: existingThread, error: threadError } = await supabaseAdmin
      .from("threads")
      .select("id")
      .eq("id", threadId)
      .single();

    if (threadError || !existingThread) {
      console.log("Thread does not exist, creating it:", threadId);
      // Create the thread if it doesn't exist using upsert to avoid race conditions
      const { error: createThreadError } = await supabaseAdmin
        .from("threads")
        .upsert({
          id: threadId,
          user_id: userId,
          title: "New Chat",
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (createThreadError) {
        console.error("Failed to create thread:", createThreadError);
        throw new Error(
          `Failed to create thread: ${createThreadError.message}`
        );
      }
      console.log("Thread created successfully:", threadId);
    } else {
      console.log("Thread exists:", threadId);
    }

    // Check if user message already exists (saved by ChatPanel)
    const { data: existingMessages } = await supabaseAdmin
      .from("messages")
      .select("id, role, content")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .limit(5); // Get last 5 messages to find recent user message

    let userMessageId: string | undefined;
    let assistantMessageId: string | undefined;

    // Look for existing user message with same content
    const existingUserMessage = existingMessages?.find(
      (msg: any) => msg.role === "user" && msg.content === lastUserMessage.content
    );

    if (existingUserMessage) {
      console.log("Found existing user message:", existingUserMessage.id);
      userMessageId = existingUserMessage.id;
    } else {
      // Save user message if it doesn't exist
      console.log("Saving new user message...");
      const { data: userMsg, error: userError } = await supabaseAdmin
        .from("messages")
        .insert({
          thread_id: threadId,
          role: "user",
          content: lastUserMessage.content,
        })
        .select("id")
        .single();

      if (userError) {
        console.error("Error saving user message:", userError);
        throw new Error(`Failed to save user message: ${userError.message}`);
      } else {
        userMessageId = userMsg.id;
        console.log("User message saved with ID:", userMessageId);
      }
    }

    // Look for existing assistant message placeholder (saved by ChatPanel)
    const existingAssistantMessage = existingMessages?.find(
      (msg: any) =>
        msg.role === "assistant" &&
        (msg.content === "" || msg.content.length < 50)
    );

    if (existingAssistantMessage) {
      console.log(
        "Updating existing assistant message:",
        existingAssistantMessage.id
      );
      // Update existing assistant message with final content
      const { error: updateError } = await supabaseAdmin
        .from("messages")
        .update({ content: assistantResponse })
        .eq("id", existingAssistantMessage.id);

      if (updateError) {
        console.error("Error updating assistant message:", updateError);
        throw new Error(
          `Failed to update assistant message: ${updateError.message}`
        );
      } else {
        assistantMessageId = existingAssistantMessage.id;
        console.log("Assistant message updated with ID:", assistantMessageId);
      }
    } else {
      // Create new assistant message if none exists
      console.log("Creating new assistant message...");
      const { data: assistantMsg, error: assistantError } = await supabaseAdmin
        .from("messages")
        .insert({
          thread_id: threadId,
          role: "assistant",
          content: assistantResponse,
        })
        .select("id")
        .single();

      if (assistantError) {
        console.error("Error saving assistant message:", assistantError);
        throw new Error(
          `Failed to save assistant message: ${assistantError.message}`
        );
      } else {
        assistantMessageId = assistantMsg.id;
        console.log("Assistant message saved with ID:", assistantMessageId);
      }
    }

    // @fix-model-persistence - Save model information to message_responses table
    if (assistantMessageId && model) {
      console.log(`💾 Saving model information: ${model} for message ${assistantMessageId}`);
      const { error: responseError } = await supabaseAdmin
        .from("message_responses")
        .insert({
          message_id: assistantMessageId,
          model: model,
          content: assistantResponse,
          tokens_used: 0, // Will be updated by token tracking
          is_primary: true, // This is the primary response
        });

      if (responseError) {
        console.error("Error saving model response:", responseError);
        // Don't throw error here as the message was saved successfully
        // Just log the error for debugging
      } else {
        console.log(`✅ Model information saved: ${model}`);
      }
    }

    // @ui-polish - Auto-title on first user message with better logic
    const messageCount = existingMessages?.length || 0;
    const isFirstMessage = messageCount <= 2; // User + assistant message = first conversation
    
    if (isFirstMessage) {
      // Generate a smart title from the user message
      const smartTitle = generateSmartTitle(lastUserMessage.content);
      await supabaseAdmin
        .from("threads")
        .update({
          title: smartTitle,
        })
        .eq("id", threadId)
        .eq("title", "New Chat"); // Only update if it's still the default title
      
      console.log(`📝 Updated thread title to: "${smartTitle}"`);
    }

    return { userMessageId, assistantMessageId };
  } catch (error) {
    console.error("Error saving messages to thread:", error);
    return {};
  }
}

// @ui-polish - Generate a smart title from user message
function generateSmartTitle(userMessage: string): string {
  const maxLength = 40;
  
  // Clean up the message
  let title = userMessage.trim();
  
  // Remove common prefixes
  const prefixes = [
    "can you",
    "could you",
    "please",
    "help me",
    "i need",
    "i want",
    "how do i",
    "how to",
    "what is",
    "what are",
    "explain",
    "tell me",
  ];
  
  const lowerTitle = title.toLowerCase();
  for (const prefix of prefixes) {
    if (lowerTitle.startsWith(prefix)) {
      title = title.substring(prefix.length).trim();
      break;
    }
  }
  
  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }
  
  // Truncate if too long
  if (title.length > maxLength) {
    title = title.substring(0, maxLength - 3) + "...";
  }
  
  // Fallback if title is too short or empty
  if (title.length < 3) {
    title = "New Chat";
  }
  
  return title;
}

// @clydra-core Helper function to save chat to Supabase
async function saveChatToHistory(
  userId: string, // Now expects Supabase UUID
  messages: Array<{ role: string; content: string }>,
  assistantResponse: string,
  model: string
): Promise<void> {
  try {
    // userId is already a Supabase UUID, no need to convert

    // Add the assistant response to messages
    const fullConversation = [
      ...messages,
      { role: "assistant", content: assistantResponse },
    ];

    // Create or update chat history
    const { error } = await supabaseAdmin.from("chat_history").insert({
      user_id: userId, // Already a Supabase UUID
      title: generateChatTitle(messages[0]?.content || "New Chat"),
      messages: fullConversation,
      model,
      last_message_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving chat to history:", error);
    }
  } catch (error) {
    console.error("Error saving chat to history:", error);
  }
}

// @clydra-core Generate a title from the first user message
function generateChatTitle(firstMessage: string): string {
  const maxLength = 50;
  if (firstMessage.length <= maxLength) {
    return firstMessage;
  }
  return firstMessage.substring(0, maxLength - 3) + "...";
}
