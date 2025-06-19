/**
 * @clydra-core
 * Convo Core - Chat History API
 *
 * Endpoint for managing chat conversations and history
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabase } from "../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // @clydra-core Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      // @clydra-core Get chat history for user
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .single();

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { data: conversations, error } = await supabase
        .from("chat_history")
        .select("*")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching chat history:", error);
        return res.status(500).json({ error: "Failed to fetch chat history" });
      }

      return res.status(200).json({ conversations: conversations || [] });
    } else if (req.method === "DELETE") {
      // @clydra-core Delete a conversation
      const { conversationId } = req.query;

      if (!conversationId || typeof conversationId !== "string") {
        return res.status(400).json({ error: "Conversation ID required" });
      }

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .single();

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { error } = await supabase
        .from("chat_history")
        .delete()
        .eq("id", conversationId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting conversation:", error);
        return res.status(500).json({ error: "Failed to delete conversation" });
      }

      return res.status(200).json({ success: true });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Chat history API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
