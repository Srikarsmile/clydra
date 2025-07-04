// @multi-model - API for fetching all responses for a message
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { getOrCreateUser } from "../../../../lib/user-utils";
import { MODEL_ALIASES } from "../../../../types/chatModels";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
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

    const { messageId } = req.query;

    if (!messageId || typeof messageId !== "string") {
      return res.status(400).json({ error: "Valid messageId is required" });
    }

    // Verify the user owns this message
    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .select(
        `
        id,
        thread_id,
        threads!inner(
          user_id
        )
      `
      )
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user owns this thread
    if ((message.threads as any).user_id !== userResult.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get all responses for this message
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from("message_responses")
      .select("*")
      .eq("message_id", messageId)
      .order("created_at", { ascending: true });

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
      return res.status(500).json({ error: "Failed to fetch responses" });
    }

    // Format responses with model display names
    const formattedResponses = responses.map((response, index) => ({
      id: response.id,
      model: response.model,
      modelDisplayName:
        MODEL_ALIASES[response.model as keyof typeof MODEL_ALIASES] ||
        response.model,
      content: response.content,
      tokensUsed: response.tokens_used,
      isPrimary: response.is_primary,
      createdAt: response.created_at,
      responseNumber: index + 1,
      totalResponses: responses.length,
    }));

    return res.status(200).json({
      messageId,
      responses: formattedResponses,
      hasMultipleResponses: responses.length > 1,
    });
  } catch (error) {
    console.error("Get responses API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
