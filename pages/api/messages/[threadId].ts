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
      const { data, error } = await supabaseAdmin
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      res.status(200).json(data || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: "Method not allowed" });
  }
}
