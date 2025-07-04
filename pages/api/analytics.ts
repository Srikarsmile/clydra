import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the user ID from Clerk
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch total chats from chat_history table
    const { count: totalChats } = await supabase
      .from("chat_history")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    // Fetch total tokens used from user_generations table
    const { data: tokenData } = await supabase
      .from("user_generations")
      .select("input_tokens, output_tokens")
      .eq("user_id", userId);

    const totalTokens =
      tokenData?.reduce(
        (acc, curr) =>
          acc + (curr.input_tokens || 0) + (curr.output_tokens || 0),
        0
      ) || 0;

    // Get the most recently used model
    const { data: recentChat } = await supabase
      .from("chat_history")
      .select("model")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Format model name for display
    const modelMap: { [key: string]: string } = {
      "anthropic/claude-3-sonnet-20240229": "Claude 3 Sonnet",
      "anthropic/claude-3-opus-20240229": "Claude 3 Opus",
      "openai/gpt-4-turbo": "GPT-4 Turbo",
      "google/gemini-1.0-pro": "Gemini Pro",
      "mistral/mistral-large-2024-01": "Mistral Large",
      "openai/gpt-3.5-turbo": "GPT-3.5 Turbo",
    };

    const activeModel = recentChat?.model
      ? modelMap[recentChat.model] || recentChat.model
      : "Claude 3 Sonnet";

    return res.status(200).json({
      totalChats: totalChats || 0,
      totalTokens,
      activeModel,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({
      error: "Failed to fetch analytics data",
    });
  }
}
