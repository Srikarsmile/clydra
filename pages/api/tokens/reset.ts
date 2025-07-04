import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { resetDailyTokens } from "../../../server/lib/grantDailyTokens";
import { getOrCreateUser } from "../../../lib/user-utils";
import { supabase } from "../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Development mode bypass
    if (process.env.NODE_ENV === "development") {
      // Reset tokens for all users in development
      const { data: users, error } = await supabase
        .from("users")
        .select("id")
        .limit(10);

      if (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Failed to fetch users" });
      }

      if (users && users.length > 0) {
        // Reset tokens for all existing users
        for (const user of users) {
          await resetDailyTokens(user.id);
        }
        return res.status(200).json({
          message: `Daily tokens reset for ${users.length} users`,
          tokens: 40000,
        });
      } else {
        return res.status(200).json({
          message: "No users found to reset tokens for",
          tokens: 40000,
        });
      }
    }

    // Production mode - require authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Convert Clerk ID to Supabase UUID
    const userResult = await getOrCreateUser(userId);
    if (!userResult.success || !userResult.user) {
      return res.status(404).json({ error: "User not found" });
    }

    const supabaseUserId = userResult.user.id;

    // Reset tokens
    await resetDailyTokens(supabaseUserId);

    return res.status(200).json({
      message: "Daily tokens reset to 40,000",
      tokens: 40000,
    });
  } catch (error) {
    console.error("Error resetting tokens:", error);
    return res.status(500).json({ error: "Failed to reset tokens" });
  }
}
