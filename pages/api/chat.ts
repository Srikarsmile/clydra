// @or OpenRouter Chat API with Web Search capability
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { estimateConversationTokens } from "../../server/lib/chatTokens";
import {
  MODEL_ALIASES,
  ChatModel,
  modelSupportsWebSearch,
} from "../../types/chatModels";
import { callModel, getSystemPrompt } from "../../lib/models";

// Helper to validate language codes (duplicated from models.ts to avoid circular imports)
function isValidLanguageCode(lang: string): boolean {
  const validLanguageCodes = [
    'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi',
    'he', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'et', 'lv', 'lt', 'el', 'mt', 'cy', 'ga', 'is', 'fo', 'uk', 'be',
    'mk', 'sq', 'sr', 'bs', 'me', 'xk', 'ka', 'hy', 'az', 'kk', 'ky', 'uz', 'tk', 'mn', 'fa', 'ps', 'ur', 'bn', 'ne',
    'si', 'my', 'km', 'lo', 'ms', 'id', 'tl', 'sw', 'am', 'ti', 'so', 'af', 'zu', 'xh', 'st', 'tn', 'ss', 've', 'ts', 'nr'
  ];
  return lang.length === 2 && validLanguageCodes.includes(lang.toLowerCase());
}
import { cleanResponse, isValidResponse } from "../../lib/clean";
import { getOrCreateUser } from "../../lib/user-utils";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../../lib/logger";
import { z } from "zod";

// Validation schemas
const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content is required").max(10000, "Message too long"),
});

const ChatRequestSchema = z.object({
  model: z.string().min(1, "Model is required"),
  messages: z.array(ChatMessageSchema).min(1, "At least one message is required"),
  enableWebSearch: z.boolean().optional().default(false),
  preferredLang: z.string().optional(),
});

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  model: ChatModel;
  messages: ChatMessage[];
  enableWebSearch?: boolean;
  preferredLang?: string;
}

// User-scoped Supabase client helper
function createUserScopedSupabaseClient(userId: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'user-id': userId,
        },
      },
    }
  );
}

// Web search function using SerpAPI or similar
async function performWebSearch(query: string): Promise<string> {
  try {
    // For now, return a placeholder. In production, integrate with SerpAPI, Tavily, or similar
    logger.debug("Web search requested", { query });
    return `Recent web search results for "${query}": [Web search functionality will be implemented with SerpAPI integration]`;
  } catch (error) {
    logger.error("Web search error", error, { query });
    return "Web search temporarily unavailable.";
  }
}

// @or Helper for usage logging
async function logUsage(
  userId: string, 
  inputTokens: number, 
  outputTokens: number, 
  model: ChatModel, 
  webSearchUsed: boolean = false
): Promise<void> {
  const { addTokens } = await import("../../server/lib/tokens");
  const totalTokens = inputTokens + outputTokens;
  
  try {
    await addTokens(userId, totalTokens, model, webSearchUsed);
  } catch (error) {
    console.error("Failed to log token usage:", error);
    // Don't throw - continue with chat response
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  let clerkUserId: string | null = null;
  
  if (req.method !== "POST") {
    logger.warn("Invalid method attempted", { method: req.method, endpoint: "/api/chat" });
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate request body
    const validationResult = ChatRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      logger.warn("Invalid request body", { 
        errors: validationResult.error.errors,
        endpoint: "/api/chat" 
      });
      return res.status(400).json({ 
        error: "Invalid request", 
        details: validationResult.error.errors 
      });
    }

    const { model, messages, enableWebSearch, preferredLang: clientPreferredLang } = validationResult.data;

    // @or Guard behind feature flag
    const isOpenRouterEnabled =
      process.env.NEXT_PUBLIC_USE_OPENROUTER === "true";
    if (!isOpenRouterEnabled) {
      logger.warn("OpenRouter feature disabled", { endpoint: "/api/chat" });
      return res.status(503).json({
        error: "Chat feature is not yet available",
      });
    }

    // Check authentication
    const { userId } = getAuth(req);
    clerkUserId = userId;
    if (!clerkUserId) {
      logger.warn("Unauthorized chat attempt", { endpoint: "/api/chat" });
      return res.status(401).json({ error: "Unauthorized" });
    }

    logger.info("Chat request received", {
      userId: clerkUserId,
      model,
      messageCount: messages.length,
      webSearch: enableWebSearch,
      endpoint: "/api/chat"
    });

    // Get user and create user-scoped client
    const userResult = await getOrCreateUser(clerkUserId);
    if (!userResult.success || !userResult.user) {
      return res.status(400).json({ error: "User not found" });
    }
    
    const userSupabase = createUserScopedSupabaseClient(userResult.user.id);
    
    // Get user's preferred language
    const { data: userData } = await userSupabase
      .from('users')
      .select('preferred_lang')
      .eq('id', userResult.user.id)
      .single();
    
    // Validate and sanitize language preference 
    const sanitizedClientLang = clientPreferredLang && isValidLanguageCode(clientPreferredLang) ? clientPreferredLang : null;
    const sanitizedUserLang = userData?.preferred_lang && isValidLanguageCode(userData.preferred_lang) ? userData.preferred_lang : null;
    const preferredLang = sanitizedUserLang || sanitizedClientLang || 'en';

    const {
      stream = false,
    }: { stream?: boolean } = req.body;

    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    // Validate incoming model
    const validatedModel: ChatModel = MODEL_ALIASES[model as ChatModel]
      ? (model as ChatModel)
      : "google/gemini-2.5-flash-preview";

    // Check if web search is enabled and model supports it
    const shouldUseWebSearch =
      enableWebSearch && modelSupportsWebSearch(validatedModel);

    // Prepare messages with system prompt
    const systemPrompt = getSystemPrompt(preferredLang);
    const enhancedMessages = [...messages];
    
    // Add universal system prompt if not already present
    if (!enhancedMessages.find(msg => msg.role === 'system')) {
      enhancedMessages.unshift({
        role: 'system',
        content: systemPrompt,
      });
    } else {
      // Prepend to existing system message
      const systemIndex = enhancedMessages.findIndex(msg => msg.role === 'system');
      enhancedMessages[systemIndex].content = `${systemPrompt}\n\n${enhancedMessages[systemIndex].content}`;
    }

    // If web search is enabled, perform search based on the latest user message
    if (shouldUseWebSearch && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === "user") {
        const searchResults = await performWebSearch(lastUserMessage.content);

        // Add web search context to the conversation
        enhancedMessages.push({
          role: "system",
          content: `You have access to current web search results. Here are recent search results relevant to the user's query: ${searchResults}. Use this information to provide more accurate and up-to-date responses.`,
        });
      }
    }

    const inputTokens = estimateConversationTokens(
      enhancedMessages,
      validatedModel
    );

    try {
      // Lightning-fast configuration for maximum speed
      const modelResponse = await callModel(validatedModel, enhancedMessages, {
        temperature: 0.1, // Minimal randomness for speed
        maxTokens: stream ? 200 : 400, // Ultra-short responses
        stream: stream,
        webSearch: shouldUseWebSearch,
        preferredLang: preferredLang,
        cache: true,
        parallel: true,
        priority: "high",
      });

      if (stream && modelResponse.stream) {
        // Handle streaming response
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const reader = modelResponse.stream.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
          }
        } finally {
          reader.releaseLock();
        }
        
        res.end();
        return;
      } else {
        // Handle regular response
        const assistantMessage = cleanResponse(modelResponse.content);
        
        // Validate response quality
        if (!isValidResponse(assistantMessage)) {
          return res.status(500).json({
            error: "Generated response did not meet quality standards",
          });
        }

        await logUsage(
          clerkUserId,
          inputTokens,
          Math.ceil(assistantMessage.length / 4),
          validatedModel,
          shouldUseWebSearch
        );

        return res.status(200).json({
          message: {
            role: "assistant",
            content: assistantMessage,
          },
          usage: modelResponse.usage || {
            inputTokens: inputTokens,
            outputTokens: Math.ceil(assistantMessage.length / 4),
            totalTokens: inputTokens + Math.ceil(assistantMessage.length / 4),
          },
          webSearchUsed: shouldUseWebSearch,
        });
      }
    } catch (modelError: unknown) {
      const duration = Date.now() - startTime;
      logger.error("Model API error", modelError, {
        userId: clerkUserId,
        model,
        duration,
        endpoint: "/api/chat"
      });

      // Handle specific error cases
      if (
        modelError &&
        typeof modelError === "object" &&
        "status" in modelError
      ) {
        const errorWithStatus = modelError as {
          status?: number;
          message?: string;
        };
        if (errorWithStatus.status === 401) {
          return res.status(401).json({ error: "Invalid API key" });
        } else if (errorWithStatus.status === 429) {
          return res.status(429).json({ error: "Rate limit exceeded" });
        } else if (errorWithStatus.status === 500) {
          return res
            .status(500)
            .json({ error: "Model API internal server error" });
        }

        return res.status(errorWithStatus.status || 500).json({
          error: errorWithStatus.message || "Model API error",
        });
      }

      return res.status(500).json({
        error: "Model API error",
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Chat API error", error, {
      userId: clerkUserId || undefined,
      duration,
      endpoint: "/api/chat"
    });
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to process chat request",
    });
  }
}