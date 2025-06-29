// @threads - Thread management API endpoint
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
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

  if (req.method === "GET") {
    try {
      // @ui-polish - Add message count via subquery
      const { data, error } = await supabaseAdmin
        .from("threads")
        .select(
          `
          *,
          msg_count:messages(count)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      res.status(200).json(data || []);
    } catch (error) {
      console.error("Failed to fetch threads:", error);
      res.status(500).json({ error: "Failed to fetch threads" });
    }
  } else if (req.method === "POST") {
    try {
      const { data, error } = await supabaseAdmin
        .from("threads")
        .insert({ user_id: user.id })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      res.status(201).json({ id: data.id });
    } catch (error) {
      console.error("Failed to create thread:", error);
      res.status(500).json({ error: "Failed to create thread" });
    }
  } else if (req.method === "DELETE") {
    // Improved thread deletion functionality with better error handling
    try {
      const { threadId } = req.body;



      if (!threadId) {
        console.error("No threadId provided in request body");
        return res.status(400).json({ error: "Thread ID is required" });
      }

      // Verify thread exists and belongs to user before deletion
      const { data: existingThread, error: verifyError } = await supabaseAdmin
        .from("threads")
        .select("id, user_id")
        .eq("id", threadId)
        .eq("user_id", user.id)
        .single();

      if (verifyError) {
        console.error("Error verifying thread ownership:", verifyError);
        if (verifyError.code === 'PGRST116') { // No rows returned
          return res.status(404).json({ error: "Thread not found or access denied" });
        }
        throw verifyError;
      }

      if (!existingThread) {
        console.error("Thread not found or user doesn't have access:", { threadId, userId: user.id });
        return res.status(404).json({ error: "Thread not found or access denied" });
      }



      // First delete all messages in the thread
      const { error: messagesError } = await supabaseAdmin
        .from("messages")
        .delete()
        .eq("thread_id", threadId);

      if (messagesError) {
        console.error("Failed to delete messages:", messagesError);
        // Don't fail the whole operation if message deletion fails
        // Messages will be cleaned up by cascade delete
      }

      // Then delete the thread
      const { error: deleteError } = await supabaseAdmin
        .from("threads")
        .delete()
        .eq("id", threadId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Failed to delete thread:", deleteError);
        throw deleteError;
      }


      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Failed to delete thread - full error:", error);
      res.status(500).json({ 
        error: "Failed to delete thread", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    res.status(405).json({ error: "Method not allowed" });
  }
}
