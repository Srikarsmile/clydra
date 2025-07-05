// @threads - Message management API endpoint
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { getOrCreateUser } from "../../../lib/user-utils";

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

  // Get or create user in Supabase
  const userResult = await getOrCreateUser(userId);

  if (!userResult.success || !userResult.user) {
    return res.status(500).json({ error: "Failed to authenticate user" });
  }

  // Verify thread ownership
  const { data: thread } = await supabaseAdmin
    .from("threads")
    .select("*")
    .eq("id", threadId)
    .eq("user_id", userResult.user.id)
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
      const messageIds =
        messages?.filter((m) => m.role === "assistant").map((m) => m.id) || [];
      let modelData: { message_id: string; model: string }[] = [];

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
      const modelMap = new Map(modelData.map((r) => [r.message_id, r.model]));

      // Transform data to include model information
      const messagesWithModel = (messages || []).map((message) => ({
        id: message.id,
        thread_id: message.thread_id,
        role: message.role,
        content: message.content,
        created_at: message.created_at,
        model:
          message.role === "assistant"
            ? modelMap.get(message.id) || null
            : null,
      }));

      res.status(200).json(messagesWithModel);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  } else if (req.method === "POST") {
    try {
      const { role, content } = req.body;

      if (!role || !content) {
        return res.status(400).json({ error: "Role and content are required" });
      }

      if (!["user", "assistant"].includes(role)) {
        return res
          .status(400)
          .json({ error: "Role must be 'user' or 'assistant'" });
      }

      // Insert the message
      const { data: message, error } = await supabaseAdmin
        .from("messages")
        .insert({
          thread_id: threadId,
          role,
          content,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      res.status(201).json(message);
    } catch (error) {
      console.error("Failed to save message:", error);
      res.status(500).json({ error: "Failed to save message" });
    }
  } else if (req.method === "PUT") {
    // @persistence-fix - Update message content (for streaming updates)
    try {
      const { messageId, content } = req.body;

      if (!messageId || !content) {
        return res
          .status(400)
          .json({ error: "messageId and content are required" });
      }

      // Verify the message belongs to this thread and user owns it
      const { data: message, error: verifyError } = await supabaseAdmin
        .from("messages")
        .select("id, thread_id")
        .eq("id", messageId)
        .eq("thread_id", threadId)
        .single();

      if (verifyError || !message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Update the message content
      const { error: updateError } = await supabaseAdmin
        .from("messages")
        .update({ content })
        .eq("id", messageId);

      if (updateError) {
        throw updateError;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Failed to update message:", error);
      res.status(500).json({ error: "Failed to update message" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    res.status(405).json({ error: "Method not allowed" });
  }
}
