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
import { getRemainingDailyTokens, consumeDailyTokens } from "../lib/grantDailyTokens"; // @grant-40k
import { addTokens } from "../lib/tokens"; // @model-multiplier - Import token tracking with multipliers
import { computeEffectiveTokens, MODEL_MULTIPLIER, WEB_SEARCH_MULTIPLIER } from "../lib/tokens"; // @margin-patch - Import token multiplier system
import { supabaseAdmin } from "../../lib/supabase";
import { getOrCreateUser } from "../../lib/user-utils";
import { MODEL_ALIASES, ChatModel, MODELS_WITH_WEB_SEARCH } from "../../types/chatModels";

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
      // @dashboard-redesign - Models matching the design brief
      "google/gemini-2.5-flash", // Free model
      "openai/gpt-4o",
      "anthropic/claude-sonnet-4", // Updated to new Claude Sonnet 4
      "google/gemini-2.5-pro",
      // Legacy models for compatibility
      "openai/gpt-4o-mini",
      "deepseek/deepseek-r1",
      "x-ai/grok-3-beta",
      "google/gemini-2.5-flash-preview",
      "anthropic/claude-opus-4",
      "anthropic/claude-3-sonnet-20240229",
      "google/gemini-1.5-pro",
      "anthropic/claude-3-opus-20240229",
      "meta-llama/llama-3-70b-instruct",
    ] as const)
    .default("google/gemini-2.5-flash"), // @dashboard-redesign - Default to free Gemini 2.5 Flash
  threadId: z.string().optional(), // @threads - Add threadId support
  enableWebSearch: z.boolean().optional().default(false), // @web-search - Add web search toggle
  webSearchContextSize: z.enum(["low", "medium", "high"]).optional().default("medium"), // @web-search - Search context size
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
  const userResult = await getOrCreateUser(clerkUserId);
  if (!userResult.success || !userResult.user) {
    throw new ChatError(
      "UNAUTHORIZED",
      "User not found or could not be created"
    );
  }
  const userId = userResult.user.id; // Now we have the Supabase UUID

  // @clydra-core Validate input
  const validatedInput = chatInputSchema.parse(input);

  // @clydra-core Validate incoming model against MODEL_ALIASES
  const model: ChatModel = MODEL_ALIASES[validatedInput.model as ChatModel]
    ? (validatedInput.model as ChatModel)
    : "openai/gpt-4o";

  // @web-search - Check if web search should be enabled
  const shouldUseWebSearch = validatedInput.enableWebSearch && 
    MODELS_WITH_WEB_SEARCH.includes(model);

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
  const inputTokens = estimateConversationTokens(
    validatedInput.messages,
    model
  );

  // @grant-40k - Check daily token quota (primary limit)
  const remainingTokens = await getRemainingDailyTokens(userId);

  if (remainingTokens < inputTokens) {
    throw new ChatError("FORBIDDEN", `Insufficient daily tokens. Need ${inputTokens}, have ${remainingTokens}.`);
  }

  // Note: Removed legacy daily message limit check in favor of token-based system
  // The token system (40K daily) is more sophisticated and should be the primary limit

  // @clydra-core Set up OpenRouter client via OpenAI SDK
  const baseURL = process.env.OPENROUTER_BASE || "https://openrouter.ai/api/v1";
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new ChatError(
      "INTERNAL_SERVER_ERROR",
      "OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your environment."
    );
  }

  const openai = new OpenAI({
    baseURL,
    apiKey,
    defaultHeaders: {
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Clydra Chat",
    },
    // @performance - Optimize connection settings for reduced latency
    timeout: 30000, // Reduced to 30 seconds for faster failures
    maxRetries: 1, // Minimize retries for faster responses
  });

  try {
          // @performance - Streaming vs Non-streaming logic
      if (enableStreaming) {
        // @margin-patch - Calculate effective tokens with model multiplier
        const effectiveInputTokens = await computeEffectiveTokens(model, inputTokens, shouldUseWebSearch);
        
        // @performance - Optimized streaming implementation
        // Consume input tokens immediately, output tokens after completion
        await consumeDailyTokens(userId, effectiveInputTokens);

      const completion = await openai.chat.completions.create({
        model: openRouterModel, // @web-search - Use model with :online suffix if web search enabled
        messages: validatedInput.messages,
        // @performance - Optimized parameters for lower latency
        temperature: 0.7, // Balanced for speed and quality
        max_tokens: 2000, // Reduced for faster completion
        top_p: 0.9, // More focused sampling
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: true,
        // @web-search - Add web search options for compatible models
        ...(shouldUseWebSearch && {
          web_search_options: {
            search_context_size: validatedInput.webSearchContextSize,
          },
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
              }

              // Track token usage from the stream
              if (chunk.usage) {
                totalTokens = chunk.usage.total_tokens || totalTokens;
              }
            }

            // Calculate and consume output tokens
            const outputTokens = Math.ceil(fullMessage.length / 4); // Rough estimate
            await Promise.all([
              consumeDailyTokens(userId, outputTokens),
              updateUsageMeter(userId, inputTokens + outputTokens),
              // @model-multiplier - Track effective tokens with model multipliers and web search cost
              addTokens(userId, inputTokens + outputTokens, model, shouldUseWebSearch),
            ]).catch(error => {
              console.error("Token consumption failed:", error);
            });

            // Save final message and get database ID
            let finalMessageId: string | undefined;
            if (threadId || input.threadId) {
              try {
                console.log(`💾 Saving final message to database for thread: ${threadId || input.threadId}`);
                const { assistantMessageId } = await saveMessagesToThread(
                  userId,
                  threadId || input.threadId!,
                  validatedInput.messages,
                  fullMessage
                );
                finalMessageId = assistantMessageId;
                console.log(`✅ Final message saved with ID: ${finalMessageId}`);
              } catch (error) {
                console.error("❌ Final save failed:", error);
              }
            }

            // Send completion message with ID
            if (finalMessageId) {
              console.log(`📤 Sending completion message with ID: ${finalMessageId}`);
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ messageId: finalMessageId, type: "completion" })}\n\n`
                )
              );
            } else {
              console.log('⚠️ No final message ID available for completion');
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
      const completion = await openai.chat.completions.create({
        model: openRouterModel, // @web-search - Use model with :online suffix if web search enabled
        messages: validatedInput.messages,
        // @performance - Optimized parameters for lower latency
        temperature: 0.5, // Reduced for faster, more focused responses
        max_tokens: 3000, // Slightly reduced for faster completion
        top_p: 0.9, // More focused sampling for speed
        frequency_penalty: 0,
        presence_penalty: 0,
        // @web-search - Add web search options for compatible models
        ...(shouldUseWebSearch && {
          web_search_options: {
            search_context_size: validatedInput.webSearchContextSize,
          },
        }),
      });

      if (!completion.choices[0]?.message?.content) {
        throw new ChatError(
          "INTERNAL_SERVER_ERROR",
          "Invalid response from OpenRouter"
        );
      }

      const assistantMessage = completion.choices[0].message.content;

      // @clydra-core Calculate token usage and costs
      const outputTokens =
        completion.usage?.completion_tokens ||
        Math.ceil(assistantMessage.length / 4);
      const totalTokens = inputTokens + outputTokens;

      // @margin-patch - Calculate effective tokens with model multiplier
      const effectiveTotalTokens = await computeEffectiveTokens(model, completion.usage?.total_tokens || totalTokens, shouldUseWebSearch);

      // Log token calculation for debugging
      console.log(`Token calculation: ${completion.usage?.total_tokens || totalTokens} × ${MODEL_MULTIPLIER[model] || 1.0} (model) × ${shouldUseWebSearch ? WEB_SEARCH_MULTIPLIER : 1.0} (web search) = ${effectiveTotalTokens}`);

      // @grant-40k - Consume daily tokens and update usage meter
      await Promise.all([
        consumeDailyTokens(userId, effectiveTotalTokens),
        updateUsageMeter(userId, totalTokens),
        // @model-multiplier - Track effective tokens with model multipliers and web search cost
        addTokens(userId, effectiveTotalTokens, model, shouldUseWebSearch),
      ]);

      // @multi-model - Save chat and get message IDs
      let messageId: string | undefined;
      if (threadId || input.threadId) {
        const { assistantMessageId } = await saveMessagesToThread(
          userId,
          threadId || input.threadId!,
          validatedInput.messages,
          assistantMessage
        );
        messageId = assistantMessageId;
      } else {
        // For non-thread chats, still save to history but no message ID
        await saveChatToHistory(
          userId,
          validatedInput.messages,
          assistantMessage,
          model
        ).catch((error) => {
          console.error("Chat save operation failed:", error);
        });
      }

      return {
        message: {
          role: "assistant",
          content: assistantMessage,
          id: messageId, // Include message ID in response
          annotations: completion.choices[0].message.annotations || undefined, // @web-search - Include citations
        },
        usage: {
          inputTokens: completion.usage?.prompt_tokens || inputTokens,
          outputTokens: completion.usage?.completion_tokens || outputTokens,
          totalTokens: completion.usage?.total_tokens || totalTokens,
        },
        webSearchUsed: shouldUseWebSearch, // @web-search - Indicate if web search was used
      };
    }
  } catch (error) {
    console.error("@clydra-core OpenRouter API error:", error);

    if (error instanceof ChatError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ChatError("INTERNAL_SERVER_ERROR", error.message);
    }

    throw new ChatError(
      "INTERNAL_SERVER_ERROR",
      "Failed to process chat request"
    );
  }
}

// @threads - Helper function to save messages to thread
async function saveMessagesToThread(
  userId: string, // Now expects Supabase UUID
  threadId: string,
  userMessages: Array<{ role: string; content: string }>,
  assistantResponse: string
): Promise<{ userMessageId?: string; assistantMessageId?: string }> {
  try {
    // userId is already a Supabase UUID, no need to convert

    // Get the last user message
    const lastUserMessage = userMessages[userMessages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== "user") {
      throw new Error("Invalid message format");
    }

    console.log("Inserting messages for thread:", threadId);

    // Insert both user and assistant messages and get their IDs
    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert([
        {
          thread_id: threadId,
          role: "user",
          content: lastUserMessage.content,
        },
        {
          thread_id: threadId,
          role: "assistant",
          content: assistantResponse,
        },
      ])
      .select("id, role");

    if (error) {
      console.error("Error saving messages to thread:", error);
      return {};
    }

    console.log("Messages saved successfully to thread:", threadId);

    // Extract message IDs
    const userMessageId = data?.find(m => m.role === "user")?.id;
    const assistantMessageId = data?.find(m => m.role === "assistant")?.id;

    // @ui-polish - Auto-title on first user message
    await supabaseAdmin
      .from("threads")
      .update({
        title: lastUserMessage.content.substring(0, 40),
      })
      .eq("id", threadId)
      .eq("title", "New Chat");

    return { userMessageId, assistantMessageId };
  } catch (error) {
    console.error("Error saving messages to thread:", error);
    return {};
  }
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
