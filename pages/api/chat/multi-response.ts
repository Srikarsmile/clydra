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

    // Generate responses from all requested models
    const responses: ModelResponse[] = [];
    const errors: string[] = [];

    for (const model of models) {
      try {
        const response = await processChatRequest(
          clerkUserId,
          { messages, model },
          undefined, // Don't save to thread yet
          false // No streaming for multi-response
        );

        if ("message" in response) {
          responses.push({
            model,
            content: response.message.content,
            tokens: response.usage.totalTokens,
          });

          // Save response to database if we have a message ID
          if (userMessageId) {
            await supabaseAdmin.from("message_responses").insert({
              message_id: userMessageId,
              model,
              content: response.message.content,
              tokens_used: response.usage.totalTokens,
              is_primary: responses.length === 1, // First response is primary
            });
          }
        }
      } catch (error) {
        console.error(`Error with model ${model}:`, error);
        errors.push(`${model}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    if (responses.length === 0) {
      return res.status(500).json({
        error: "All models failed to generate responses",
        details: errors,
      });
    }

    // Create assistant message entry if we have responses and threadId
    if (threadId && responses.length > 0) {
      const primaryResponse = responses[0];
      await supabaseAdmin.from("messages").insert({
        thread_id: threadId,
        role: "assistant", 
        content: primaryResponse.content,
      });
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