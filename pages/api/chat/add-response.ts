import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { processChatRequest } from "../../../server/api/chat";
import { supabaseAdmin } from "../../../lib/supabase";
import { getOrCreateUser } from "../../../lib/user-utils";
import { ChatModel } from "../../../types/chatModels";

interface AddResponseRequest {
  messageId: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  model: ChatModel;
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

    const { messageId, messages, model }: AddResponseRequest = req.body;

    if (!messageId || !messages || !Array.isArray(messages) || !model) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`🚀 Adding ${model} response to message ${messageId}...`);
    const startTime = Date.now();

    try {
      // Generate response using the single chat API (much faster)
      const response = await processChatRequest(
        clerkUserId,
        {
          messages,
          model,
          enableWebSearch: false, // @web-search - Disable web search for add-response
          webSearchContextSize: "medium", // @web-search - Default context size
          enableWikiGrounding: false, // @sarvam - Disable wiki grounding for add-response
        },
        undefined, // Don't save to thread
        false // No streaming
      );

      const endTime = Date.now();
      console.log(`✅ ${model} response completed in ${endTime - startTime}ms`);

      if ("message" in response) {
        // Save the new response to the database
        const { error: insertError } = await supabaseAdmin
          .from("message_responses")
          .insert({
            message_id: messageId,
            model: model,
            content: response.message.content,
            tokens_used: response.usage.totalTokens,
            is_primary: false, // Alternative response
          });

        if (insertError) {
          console.error("Error saving response:", insertError);
          return res.status(500).json({ error: "Failed to save response" });
        }

        return res.status(200).json({
          success: true,
          response: {
            model,
            content: response.message.content,
            tokens: response.usage.totalTokens,
          },
        });
      } else {
        return res.status(500).json({ error: "Failed to generate response" });
      }
    } catch (error) {
      console.error(`Error with model ${model}:`, error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate response",
      });
    }
  } catch (error) {
    console.error("Add response API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
