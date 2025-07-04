import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { grantDailyTokens } from "../../server/lib/grantDailyTokens";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Only available in development" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Development user IDs for testing
    const devUserIds = [userId]; // Add more test user IDs as needed

    for (const userId of devUserIds) {
      await grantDailyTokens(userId);
    }

    return res.status(200).json({
      message: `Granted 80,000 tokens to ${devUserIds.length} development users`,
      users: devUserIds,
      tokens: 80000,
    });
  } catch (error) {
    console.error("Error resetting development tokens:", error);
    return res.status(500).json({ error: "Failed to reset tokens" });
  }
}
