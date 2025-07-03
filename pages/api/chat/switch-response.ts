// @multi-model - API for switching between stored model responses
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { getOrCreateUser } from "../../../lib/user-utils";

interface SwitchResponseRequest {
  messageId: string;
  responseId: string;
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

    const { messageId, responseId }: SwitchResponseRequest = req.body;

    if (!messageId || !responseId) {
      return res.status(400).json({ error: "messageId and responseId are required" });
    }

    // Verify the user owns this message
    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .select(`
        id,
        thread_id,
        threads!inner(
          user_id
        )
      `)
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user owns this thread
    if ((message.threads as any).user_id !== userResult.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get the selected response
    const { data: selectedResponse, error: responseError } = await supabaseAdmin
      .from("message_responses")
      .select("*")
      .eq("id", responseId)
      .eq("message_id", messageId)
      .single();

    if (responseError || !selectedResponse) {
      return res.status(404).json({ error: "Response not found" });
    }

    // Update all responses for this message to not be primary
    await supabaseAdmin
      .from("message_responses")
      .update({ is_primary: false })
      .eq("message_id", messageId);

    // Set the selected response as primary
    await supabaseAdmin
      .from("message_responses")
      .update({ is_primary: true })
      .eq("id", responseId);

    // Update the main message content to match the selected response
    await supabaseAdmin
      .from("messages")
      .update({ content: selectedResponse.content })
      .eq("id", messageId);

    return res.status(200).json({
      success: true,
      response: selectedResponse,
    });
  } catch (error) {
    console.error("Switch response API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
} 