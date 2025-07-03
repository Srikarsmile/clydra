// @threads - Message management API endpoint
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);
  const { threadId } = req.query;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!threadId || typeof threadId !== "string") {
    return res.status(400).json({ error: "Thread ID is required" });
  }

  // Get user from Supabase
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("clerk_id", userId)
    .single();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Verify thread ownership
  const { data: thread } = await supabaseAdmin
    .from("threads")
    .select("*")
    .eq("id", threadId)
    .eq("user_id", user.id)
    .single();

  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }

  if (req.method === "GET") {
    try {
      // First get all messages
      const { data: messages, error } = await supabaseAdmin
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      // Then get model information for assistant messages
      const messageIds = messages?.filter(m => m.role === 'assistant').map(m => m.id) || [];
      let modelData: any[] = [];
      
      if (messageIds.length > 0) {
        const { data: responses, error: responseError } = await supabaseAdmin
          .from("message_responses")
          .select("message_id, model")
          .in("message_id", messageIds)
          .eq("is_primary", true);

        if (!responseError) {
          modelData = responses || [];
        }
      }

      // Create a map of message_id -> model
      const modelMap = new Map(modelData.map(r => [r.message_id, r.model]));

      // Transform data to include model information
      const messagesWithModel = (messages || []).map(message => ({
        id: message.id,
        thread_id: message.thread_id,
        role: message.role,
        content: message.content,
        created_at: message.created_at,
        model: message.role === 'assistant' ? modelMap.get(message.id) || null : null
      }));

      res.status(200).json(messagesWithModel);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: "Method not allowed" });
  }
}
