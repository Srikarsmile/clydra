import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getUserCreditBalance } from "../../../lib/credit-utils";
import { getOrCreateUser } from "../../../lib/user-utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get authenticated user from Clerk
    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized - Please sign in" });
    }

    // Get or create user in Supabase
    const userResult = await getOrCreateUser(clerkUserId);

    if (!userResult.success || !userResult.user) {
      return res.status(500).json({
        error: userResult.error || "Failed to get user",
      });
    }

    // Get credit balance
    const { data: balance, error } = await getUserCreditBalance(
      userResult.user.id
    );

    if (error) {
      return res.status(500).json({
        error: "Error fetching credit balance",
        details: error,
      });
    }

    return res.status(200).json({
      success: true,
      data: balance,
    });
  } catch (error) {
    console.error("Credit balance API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
