import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";
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

    const userId = userResult.user.id;

    // Get query parameters
    const { limit = '20', offset = '0' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100); // Max 100
    const offsetNum = parseInt(offset as string, 10) || 0;

    // Fetch user's generations from database
    const { data: generations, error, count } = await supabaseAdmin
      .from("user_generations")
      .select("*", { count: 'exact' })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (error) {
      console.error("Database error fetching generations:", error);
      return res.status(500).json({ error: "Failed to fetch generations" });
    }

    // Format generations for frontend
    const formattedGenerations = generations.map((gen) => ({
      id: gen.id,
      requestId: gen.request_id || gen.id,
      prompt: gen.prompt,
      model: gen.model,
      settings: gen.settings,
      result: {
        data: gen.result_data,
        requestId: gen.request_id || gen.id,
      },
      resultUrl: gen.result_url,
      cost: gen.cost,
      latency: gen.latency,
      status: gen.status,
      errorMessage: gen.error_message,
      isPinned: gen.is_pinned,
      timestamp: new Date(gen.created_at),
      createdAt: gen.created_at,
      updatedAt: gen.updated_at,
    }));

    return res.status(200).json({
      success: true,
      data: {
        generations: formattedGenerations,
        total: count,
        limit: limitNum,
        offset: offsetNum,
        hasMore: (offsetNum + limitNum) < (count || 0),
      },
    });
  } catch (error) {
    console.error("List generations API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 