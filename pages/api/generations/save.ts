import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { getOrCreateUser } from "../../../lib/user-utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
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

    // Validate request body
    const { 
      model, 
      prompt, 
      settings = {}, 
      resultData, 
      resultUrl, 
      cost = 0, 
      latency = 0, 
      requestId,
      status = 'success',
      errorMessage = null
    } = req.body;

    if (!model || !prompt || !resultData) {
      return res.status(400).json({ 
        error: "Missing required fields: model, prompt, resultData" 
      });
    }

    // Save generation to database
    const { data: generation, error } = await supabaseAdmin
      .from("user_generations")
      .insert({
        user_id: userId,
        model,
        prompt,
        settings,
        result_data: resultData,
        result_url: resultUrl,
        cost,
        latency,
        request_id: requestId,
        status,
        error_message: errorMessage,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error saving generation:", error);
      return res.status(500).json({ error: "Failed to save generation" });
    }

    return res.status(200).json({
      success: true,
      data: generation,
    });
  } catch (error) {
    console.error("Save generation API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 