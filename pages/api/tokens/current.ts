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
      return res.status(500).json({
        error: userResult.error || "Failed to get user",
      });
    }

    const userId = userResult.user.id;

    // Get token usage
    const used = await getUsage(userId);
    const cap = getCap("pro"); // TODO: fetch actual plan from database

    return res.status(200).json({
      used,
      cap,
    });
  } catch (error) {
    console.error("Error fetching token usage:", error);
    return res.status(500).json({
      error: "Failed to fetch token usage",
    });
  }
} 