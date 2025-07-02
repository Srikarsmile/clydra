// @token-meter - API endpoint for current token usage
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getUsage, getCap } from "../../../server/lib/tokens";
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
      // Return default values instead of error to prevent blocking the UI
      return res.status(200).json({
        used: 0,
        cap: 1500000,
      });
    }

    const userId = userResult.user.id;

    // Get token usage - these functions now return 0 on error instead of throwing
    const used = await getUsage(userId);
    const cap = getCap("pro"); // Default to Pro plan for all users

    return res.status(200).json({
      used,
      cap,
    });
  } catch (error) {
    console.error("Token API: Unexpected error:", error);
    // Return default values instead of 500 error to prevent blocking the UI
    return res.status(200).json({
      used: 0,
      cap: 1500000,
    });
  }
}
