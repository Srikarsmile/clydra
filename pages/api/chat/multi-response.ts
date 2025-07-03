// @multi-model - API for generating multiple model responses without token waste
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { processChatRequest } from "../../../server/api/chat";
import { supabaseAdmin } from "../../../lib/supabase";
import { getOrCreateUser } from "../../../lib/user-utils";
import { ChatModel } from "../../../types/chatModels";

interface MultiResponseRequest {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  models: ChatModel[]; // Array of models to try
  threadId?: string;
}

interface ModelResponse {
  model: ChatModel;
  content: string;
  tokens: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check authentication
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user
    const userResult = await getOrCreateUser(clerkUserId);
    if (!userResult.success || !userResult.user) {
      return res.status(400).json({ error: "User not found" });
    }

    const { messages, models, threadId }: MultiResponseRequest = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages are required" });
    }

    if (!models || !Array.isArray(models) || models.length === 0) {
      return res.status(400).json({ error: "Models are required" });
    }

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role !== "user") {
      return res.status(400).json({ error: "Last message must be from user" });
    }

    // Find existing user message in database if threadId provided
    let userMessageId: string | null = null;
    if (threadId) {
      // Insert user message if not exists
      const { data: insertedMessage, error: insertError } = await supabaseAdmin
        .from("messages")
        .insert({
          thread_id: threadId,
          role: "user",
          content: lastUserMessage.content,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error inserting user message:", insertError);
        return res.status(500).json({ error: "Failed to save user message" });
      }

      userMessageId = insertedMessage.id;
    }

    // @performance - Generate responses from all models in parallel
    const modelPromises = models.map(async (model): Promise<ModelResponse | null> => {
      try {
        console.log(`Starting request for model: ${model}`);
        const startTime = Date.now();
        
        const response = await processChatRequest(
          clerkUserId,
          { 
            messages, 
            model,
            enableWebSearch: false, // @web-search - Disable web search for multi-response (performance)
            webSearchContextSize: "medium" // @web-search - Default context size
          },
          undefined, // Don't save to thread yet
          false // No streaming for multi-response
        );

        const endTime = Date.now();
        console.log(`Model ${model} completed in ${endTime - startTime}ms`);

        if ("message" in response) {
          return {
            model,
            content: response.message.content,
            tokens: response.usage.totalTokens,
          };
        }
        return null;
      } catch (error) {
        console.error(`Error with model ${model}:`, error);
        return {
          model,
          content: "",
          tokens: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    // Wait for all models to complete (or timeout after 30 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 30000);
    });

    const results = await Promise.race([
      Promise.allSettled(modelPromises),
      timeoutPromise
    ]);

    // Process results
    const responses: ModelResponse[] = [];
    const errors: string[] = [];

    if (Array.isArray(results)) {
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          if (result.value.error) {
            errors.push(`${result.value.model}: ${result.value.error}`);
          } else {
            responses.push(result.value);
          }
        } else if (result.status === "rejected") {
          errors.push(`Model failed: ${result.reason}`);
        }
      }
    }

    if (responses.length === 0) {
      return res.status(500).json({
        error: "All models failed to generate responses",
        details: errors,
      });
    }

    // @performance - Save all responses to database in parallel
    if (userMessageId && responses.length > 0) {
      // Save responses in parallel (don't wait for completion)
      (async () => {
        try {
          const savePromises = responses.map((response, index) =>
            supabaseAdmin.from("message_responses").insert({
              message_id: userMessageId,
              model: response.model,
              content: response.content,
              tokens_used: response.tokens,
              is_primary: index === 0, // First successful response is primary
            })
          );
          await Promise.allSettled(savePromises);
        } catch (error: any) {
          console.error("Error saving responses to database:", error);
        }
      })();

      // Create assistant message entry with primary response (don't wait)
      const primaryResponse = responses[0];
      (async () => {
        try {
          await supabaseAdmin.from("messages").insert({
            thread_id: threadId,
            role: "assistant", 
            content: primaryResponse.content,
          });
        } catch (error: any) {
          console.error("Error saving assistant message:", error);
        }
      })();
    }

    return res.status(200).json({
      responses,
      errors: errors.length > 0 ? errors : undefined,
      userMessageId,
    });
  } catch (error) {
    console.error("Multi-response API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
} 