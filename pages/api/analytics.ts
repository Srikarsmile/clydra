import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../lib/supabase";
import { getOrCreateUser } from "../../lib/user-utils";

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

    // Get or create user in Supabase
    const userResult = await getOrCreateUser(userId);
    if (!userResult.success || !userResult.user) {
      return res.status(401).json({ error: "User not found" });
    }

    const supabaseUserId = userResult.user.id;

    // Fetch total chats from threads table (updated schema)
    const { count: totalChats, error: chatsError } = await supabaseAdmin
      .from("threads")
      .select("*", { count: "exact" })
      .eq("user_id", supabaseUserId);

    if (chatsError) {
      console.error("Error fetching chats:", chatsError);
    }

    // Fetch total tokens used from token_usage table (updated schema)
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("token_usage")
      .select("tokens_used")
      .eq("user_id", supabaseUserId);

    if (tokenError) {
      console.error("Error fetching tokens:", tokenError);
    }

    const totalTokens =
      tokenData?.reduce((acc, curr) => acc + (curr.tokens_used || 0), 0) || 0;

    // Get the most recently used model from message_responses
    const { data: recentResponse, error: modelError } = await supabaseAdmin
      .from("message_responses")
      .select("model")
      .eq("is_primary", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (modelError && modelError.code !== "PGRST116") {
      console.error("Error fetching recent model:", modelError);
    }

    // Format model name for display
    const modelMap: { [key: string]: string } = {
      "google/gemini-2.5-flash-preview": "Gemini 2.5 Flash",
      "openai/gpt-4o": "GPT-4o",
      "anthropic/claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
      "x-ai/grok-3": "Grok 3",
      "google/gemini-2.5-pro": "Gemini 2.5 Pro",
      "mistralai/mistral-small-3.2-24b-instruct": "Mistral Small",
      "shisa-ai/shisa-v2-llama3.3-70b:free": "Llama 3.3 70B",
      "sarvamai/sarvam-m:free": "Sarvam M",
      // Legacy models
      "anthropic/claude-3-sonnet-20240229": "Claude 3 Sonnet",
      "anthropic/claude-3-opus-20240229": "Claude 3 Opus",
      "openai/gpt-4-turbo": "GPT-4 Turbo",
      "google/gemini-1.0-pro": "Gemini Pro",
      "mistral/mistral-large-2024-01": "Mistral Large",
      "openai/gpt-3.5-turbo": "GPT-3.5 Turbo",
    };

    const activeModel = recentResponse?.model
      ? modelMap[recentResponse.model] || recentResponse.model
      : "Google Gemini Flash";

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
