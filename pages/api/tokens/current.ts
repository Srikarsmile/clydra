// @token-meter - API endpoint for current token usage (daily system)
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getRemainingDailyTokens, consumeDailyTokens, grantDailyTokens } from "../../../server/lib/grantDailyTokens";
import { getOrCreateUser } from "../../../lib/user-utils";

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

    // Get or create user in Supabase
    const userResult = await getOrCreateUser(clerkUserId);
    if (!userResult.success || !userResult.user) {
      // Return default values for new users
      return res.status(200).json({
        used: 0,
        cap: 40000, // Daily cap for free users
      });
    }

    const userId = userResult.user.id;

    // Grant daily tokens to new users (does nothing if already granted)
    await grantDailyTokens(userId);

    // Get remaining daily tokens
    const remaining = await getRemainingDailyTokens(userId);
    const cap = 40000; // 40k daily cap for free users
    const used = cap - remaining;

    return res.status(200).json({
      used: Math.max(0, used), // Ensure used is never negative
      cap,
    });
  } catch (error) {
    console.error("Token API: Unexpected error:", error);
    // Return default values instead of 500 error to prevent blocking the UI
    return res.status(200).json({
      used: 0,
      cap: 40000, // Daily cap for free users
    });
  }
}
