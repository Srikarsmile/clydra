// @threads - Thread management API endpoint
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../lib/supabase";
import { getOrCreateUser } from "../../lib/user-utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);

  console.log(
    `🔐 Threads API: method=${req.method}, userId=${userId || "undefined"}`
  );

  if (!userId) {
    console.error("❌ Threads API: No userId from getAuth");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get or create user in Supabase
  const userResult = await getOrCreateUser(userId);

  if (!userResult.success || !userResult.user) {
    console.error(
      "❌ Threads API: Failed to get or create user:",
      userResult.error
    );
    return res.status(500).json({ error: "Failed to authenticate user" });
  }

  console.log(
    `✅ Threads API: User ready for ${userId}, ID=${userResult.user.id}`
  );

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
        .eq("user_id", userResult.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Threads API: Error fetching threads:", error);
        throw error;
      }

      console.log(
        `✅ Threads API: Returning ${data?.length || 0} threads for user ${userResult.user.id}`
      );
      res.status(200).json(data || []);
    } catch (error) {
      console.error("Failed to fetch threads:", error);
      res.status(500).json({ error: "Failed to fetch threads" });
    }
  } else if (req.method === "POST") {
    try {
      const { data, error } = await supabaseAdmin
        .from("threads")
        .insert({ user_id: userResult.user.id })
        .select("id")
        .single();

      if (error) {
        console.error("❌ Threads API: Error creating thread:", error);
        throw error;
      }

      console.log(
        `✅ Threads API: Created new thread ${data.id} for user ${userResult.user.id}`
      );
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
        .eq("user_id", userResult.user.id)
        .single();

      if (verifyError) {
        console.error("Error verifying thread ownership:", verifyError);
        if (verifyError.code === "PGRST116") {
          // No rows returned
          return res
            .status(404)
            .json({ error: "Thread not found or access denied" });
        }
        throw verifyError;
      }

      if (!existingThread) {
        console.error("Thread not found or user doesn't have access:", {
          threadId,
          userId: userResult.user.id,
        });
        return res
          .status(404)
          .json({ error: "Thread not found or access denied" });
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
        .eq("user_id", userResult.user.id);

      if (deleteError) {
        console.error("Failed to delete thread:", deleteError);
        throw deleteError;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Failed to delete thread - full error:", error);
      res.status(500).json({
        error: "Failed to delete thread",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    res.status(405).json({ error: "Method not allowed" });
  }
}
