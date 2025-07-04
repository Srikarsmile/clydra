import { NextApiRequest, NextApiResponse } from "next";
import { grantDailyTokens } from "../../server/lib/grantDailyTokens";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ error: "Not found" });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Grant tokens to hardcoded development user IDs
    const devUserIds = [
      "user_2yS2w4d9SvpJNCbHtLyogP09kEM", // From logs
      "6bd64b0c-d698-46bf-ae98-12fe9d3b4c8a", // From logs
    ];

    for (const userId of devUserIds) {
      await grantDailyTokens(userId);
    }

    return res.status(200).json({
      message: `Granted 40,000 tokens to ${devUserIds.length} development users`,
      users: devUserIds,
      tokens: 40000,
    });
  } catch (error) {
    console.error("Error resetting development tokens:", error);
    return res.status(500).json({ error: "Failed to reset tokens" });
  }
}
