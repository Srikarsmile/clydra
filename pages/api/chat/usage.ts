/**
 * @clydra-core
 * Convo Core - Chat Usage API
 *
 * Endpoint for fetching user's daily chat usage statistics
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import {
  getDailyChatCount,
  getRemainingMessages,
  DAILY_MESSAGE_LIMIT,
} from "../../../server/lib/usage";
import { supabase } from "../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // @clydra-core Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user's Supabase ID
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // @clydra-core Get usage statistics
    const dailyCount = await getDailyChatCount(user.id);
    const remaining = await getRemainingMessages(user.id);

    return res.status(200).json({
      dailyCount,
      limit: DAILY_MESSAGE_LIMIT,
      remaining,
      percentage: Math.min((dailyCount / DAILY_MESSAGE_LIMIT) * 100, 100),
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch usage data",
    });
  }
}
