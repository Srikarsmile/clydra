import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { getUserCreditTransactions } from "../../../lib/credit-utils";

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

    // Get user from Supabase
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get query parameters
    const limit = parseInt(req.query.limit as string) || 50;

    // Get credit transactions
    const { data: transactions, error } = await getUserCreditTransactions(
      user.id,
      limit
    );

    if (error) {
      return res.status(500).json({
        error: "Error fetching credit transactions",
        details: error,
      });
    }

    return res.status(200).json({
      success: true,
      data: transactions || [],
      meta: {
        count: (transactions || []).length,
        limit: limit,
      },
    });
  } catch (error) {
    console.error("Credit transactions API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
