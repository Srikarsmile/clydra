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
import { hasExceededDailyLimit, updateUsageMeter } from "../lib/usage";
import { supabaseAdmin } from "../../lib/supabase";
import { MODEL_ALIASES, ChatModel } from "../../types/chatModels";

// @clydra-core Input validation schema
const chatInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ),
  model: z
    .enum([
      "openai/gpt-4o",
      "google/gemini-2.5-pro",                 // @gem25
      "google/gemini-2.5-flash-preview",
      "anthropic/claude-sonnet-4",
      "anthropic/claude-opus-4",
      "anthropic/claude-3-sonnet-20240229",
      "google/gemini-1.5-pro",
      "deepseek/deepseek-r1",
      "anthropic/claude-3-opus-20240229",
      "meta-llama/llama-3-70b-instruct",
    ] as const)
    .default("openai/gpt-4o"),
  threadId: z.string().optional(), // @threads - Add threadId support
});

export type ChatInput = z.infer<typeof chatInputSchema>;

export interface ChatResponse {
  message: {
    role: "assistant";
    content: string;
  };
  usage: {
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
 */
export async function processChatRequest(
  userId: string,
  input: ChatInput,
  threadId?: string // @threads - Add threadId parameter
): Promise<ChatResponse> {
  // @clydra-core Validate input
  const validatedInput = chatInputSchema.parse(input);

  // @clydra-core Validate incoming model against MODEL_ALIASES
  const model: ChatModel = MODEL_ALIASES[validatedInput.model as ChatModel] 
    ? (validatedInput.model as ChatModel) 
    : "openai/gpt-4o";

  // @clydra-core Guard behind feature flag
  if (!useOpenRouter()) {
    throw new ChatError(
      "SERVICE_UNAVAILABLE",
      "Chat feature is not yet available"
    );
  }

  // @clydra-core Check daily message limit
  const hasExceeded = await hasExceededDailyLimit(userId);
  if (hasExceeded) {
    throw new ChatError(
      "TOO_MANY_REQUESTS",
      "Daily message limit exceeded. Upgrade to Pro for unlimited messages."
    );
  }

  // @clydra-core Estimate input tokens
  const inputTokens = estimateConversationTokens(
    validatedInput.messages,
    model
  );

  // @clydra-core Set up OpenRouter client via OpenAI SDK
  const baseURL = process.env.OPENROUTER_BASE || "https://openrouter.ai/api/v1";
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new ChatError(
      "INTERNAL_SERVER_ERROR",
      "OpenRouter API key not configured"
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
  });

  try {
    console.log(
      `@clydra-core Making OpenRouter request for model: ${model}`
    );

    // @clydra-core Make request to OpenRouter
    const completion = await openai.chat.completions.create({
      model: model,
      messages: validatedInput.messages,
      temperature: 0.7,
      max_tokens: 4000,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
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

    // @clydra-core Update usage meter
    await updateUsageMeter(userId, totalTokens);

    // @clydra-core Save chat to history
    if (threadId || input.threadId) {
      // @threads - Save to thread-based messages
      await saveMessagesToThread(
        userId,
        threadId || input.threadId!,
        validatedInput.messages,
        assistantMessage
      );
    } else {
      // @clydra-core Legacy chat history (fallback)
      await saveChatToHistory(
        userId,
        validatedInput.messages,
        assistantMessage,
        model
      );
    }

    console.log(
      `@clydra-core OpenRouter request successful for model: ${model}`
    );

    return {
      message: {
        role: "assistant",
        content: assistantMessage,
      },
      usage: {
        inputTokens: completion.usage?.prompt_tokens || inputTokens,
        outputTokens: completion.usage?.completion_tokens || outputTokens,
        totalTokens: completion.usage?.total_tokens || totalTokens,
      },
    };
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
  userId: string,
  threadId: string,
  userMessages: Array<{ role: string; content: string }>,
  assistantResponse: string
): Promise<void> {
  try {
    // Get user info
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Get the last user message
    const lastUserMessage = userMessages[userMessages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      throw new Error('Invalid message format');
    }

    // Insert both user and assistant messages
    const { error } = await supabaseAdmin
      .from('messages')
      .insert([
        {
          thread_id: threadId,
          role: 'user',
          content: lastUserMessage.content,
        },
        {
          thread_id: threadId,
          role: 'assistant',
          content: assistantResponse,
        },
      ]);

    if (error) {
      console.error('Error saving messages to thread:', error);
      return;
    }

    // @ui-polish - Auto-title on first user message
    await supabaseAdmin
      .from('threads')
      .update({ 
        title: lastUserMessage.content.substring(0, 40) 
      })
      .eq('id', threadId)
      .eq('title', 'New Chat');

  } catch (error) {
    console.error('Error saving messages to thread:', error);
  }
}

// @clydra-core Helper function to save chat to Supabase
async function saveChatToHistory(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  assistantResponse: string,
  model: string
): Promise<void> {
  try {
    // Add the assistant response to messages
    const fullConversation = [
      ...messages,
      { role: "assistant", content: assistantResponse },
    ];

    // Create or update chat history
    const { error } = await supabaseAdmin.from("chat_history").insert({
      user_id: userId,
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
