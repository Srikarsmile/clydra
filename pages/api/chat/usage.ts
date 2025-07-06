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
import { getOrCreateUser } from "../../../lib/user-utils";

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
    const userResult = await getOrCreateUser(userId);
    if (!userResult.success || !userResult.user) {
      return res.status(401).json({ error: "User not found" });
    }
    const supabaseUserId = userResult.user.id;

    // @clydra-core Get usage statistics
    const dailyCount = await getDailyChatCount(supabaseUserId);
    const remaining = await getRemainingMessages(supabaseUserId);

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
