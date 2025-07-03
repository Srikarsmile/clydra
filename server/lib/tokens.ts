// @token-meter - Token usage tracking and quota management
import { supabaseAdmin } from "../../lib/supabase";
import { startOfMonth } from "date-fns";
import { ChatModel } from "../../types/chatModels";

// @margin-patch - Token multiplier system for different models
export const MODEL_MULTIPLIER: Record<string, number> = {
  // Free Plan Models (50% cheaper)
  "google/gemini-2.5-flash": 0.5, // Free model with 0.5x multiplier

  // Pro Plan Models
  "openai/gpt-4o": 1.0, // Base model with 1.0x multiplier
  "anthropic/claude-sonnet-4": 1.5, // Premium model with 1.5x multiplier
  "x-ai/grok-3-beta": 1.5, // Premium model with 1.5x multiplier
  "google/gemini-2.5-pro": 1.0, // Standard pro model with 1.0x multiplier

  // Legacy models (kept for compatibility)
  "openai/gpt-4o-mini": 0.75,
  "deepseek/deepseek-r1": 1.0,
  "google/gemini-2.5-flash-preview": 0.5,
  "anthropic/claude-opus-4": 2.0,
  "anthropic/claude-3-sonnet-20240229": 1.5,
  "google/gemini-1.5-pro": 1.0,
  "anthropic/claude-3-opus-20240229": 2.0,
  "meta-llama/llama-3-70b-instruct": 1.0,
};

// Web search adds 30% overhead to token consumption
export const WEB_SEARCH_MULTIPLIER = 1.3;

/**
 * Calculate effective tokens based on model and features used
 * @param modelKey - The model identifier
 * @param rawTokens - The raw token count
 * @param webSearchEnabled - Whether web search was used (adds 30% overhead)
 * @returns The effective token count after applying multipliers
 */
export async function effectiveTokens(
  modelKey: string,
  rawTokens: number,
  webSearchEnabled: boolean = false
): Promise<number> {
  const modelMultiplier = MODEL_MULTIPLIER[modelKey] ?? 1.0;
  const searchMultiplier = webSearchEnabled ? WEB_SEARCH_MULTIPLIER : 1.0;
  return Math.ceil(rawTokens * modelMultiplier * searchMultiplier);
}

// Helper function to get Supabase user ID from Clerk ID
async function getSupabaseUserId(clerkUserId: string): Promise<string | null> {
  try {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    return user?.id || null;
  } catch (error) {
    console.error("Error getting Supabase user ID:", error);
    return null;
  }
}

// Helper function to check if a string is a UUID format (Supabase ID) or Clerk ID
function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Helper function to normalize user ID (convert Clerk ID to Supabase UUID if needed)
async function normalizeUserId(userId: string): Promise<string | null> {
  if (isUUID(userId)) {
    // Already a Supabase UUID
    return userId;
  } else {
    // Clerk ID, need to convert
    return await getSupabaseUserId(userId);
  }
}

export async function addTokens(
  userId: string, 
  tokens: number, 
  model?: ChatModel, 
  usedWebSearch?: boolean
): Promise<void> {
  const month = startOfMonth(new Date());
  const monthStr = month.toISOString().split("T")[0]; // YYYY-MM-DD format

  // @model-multiplier - Calculate effective tokens based on model and web search usage
  const effectiveTokens = model 
    ? await effectiveTokens(model, tokens, usedWebSearch)
    : tokens; // Fallback to raw tokens if model not specified

  try {
    // Normalize user ID (handle both Clerk ID and Supabase UUID)
    const supabaseUserId = await normalizeUserId(userId);
    if (!supabaseUserId) {
      console.error("User not found for token tracking:", userId);
      return;
    }

    // First try to get existing record
    const { data: existing } = await supabaseAdmin
      .from("token_usage")
      .select("tokens_used")
      .eq("user_id", supabaseUserId)
      .eq("month_start", monthStr)
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabaseAdmin
        .from("token_usage")
        .update({
          tokens_used: existing.tokens_used + effectiveTokens,
        })
        .eq("user_id", supabaseUserId)
        .eq("month_start", monthStr);

      if (error) {
        console.error("Error updating tokens:", error);
        // Don't throw - just log and continue
        return;
      }
    } else {
      // Insert new record
      const { error } = await supabaseAdmin.from("token_usage").insert({
        user_id: supabaseUserId,
        month_start: monthStr,
        tokens_used: effectiveTokens,
      });

      if (error) {
        console.error("Error inserting tokens:", error);
        // Don't throw - just log and continue
        return;
      }
    }
  } catch (error) {
    console.error("Error in addTokens:", error);
    // Don't throw - just log and continue to prevent chat failures
    return;
  }
}

export async function getUsage(userId: string): Promise<number> {
  const month = startOfMonth(new Date());
  const monthStr = month.toISOString().split("T")[0]; // YYYY-MM-DD format

  try {
    // Normalize user ID (handle both Clerk ID and Supabase UUID)
    const supabaseUserId = await normalizeUserId(userId);
    if (!supabaseUserId) {
      console.error("User not found for usage tracking:", userId);
      return 0;
    }

    const { data, error } = await supabaseAdmin
      .from("token_usage")
      .select("tokens_used")
      .eq("user_id", supabaseUserId)
      .eq("month_start", monthStr)
      .single();

    // Handle table not exists or no rows found gracefully
    if (error && (error.code === "42P01" || error.code === "PGRST116")) {
      // 42P01 = table doesn't exist, PGRST116 = no rows found
      return 0;
    }

    if (error) {
      console.error("Error getting usage:", error);
      // Return 0 instead of throwing to prevent blocking the chat
      return 0;
    }

    return data?.tokens_used ?? 0;
  } catch (error) {
    console.error("Error in getUsage:", error);
    // Return 0 to allow chat to continue even if token tracking fails
    return 0;
  }
}

export function getCap(plan: "free" | "pro"): number {
  // @pro-cap
  const PLAN_CAP = {
    free : 40_000,          // daily
    pro  : 1_000_000,       // monthly  (was 1_500_000)
  } as const;
  return PLAN_CAP[plan]; // free = 40k / day, pro = 1M / month
}

// @token-meter - Check if user has exceeded quota before making request
export async function checkQuota(
  userId: string,
  requestTokens: number,
  plan: "free" | "pro",
  model?: ChatModel,
  usedWebSearch?: boolean
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const used = await getUsage(userId);
    const cap = getCap(plan);

    // @model-multiplier - Calculate effective tokens for the request
    const effectiveRequestTokens = model 
      ? await effectiveTokens(model, requestTokens, usedWebSearch)
      : requestTokens;

    if (used + effectiveRequestTokens > cap) {
      return {
        allowed: false,
        reason: `Quota exceeded. Used ${used.toLocaleString()} + ${effectiveRequestTokens.toLocaleString()} effective tokens would exceed ${cap.toLocaleString()} token limit.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error in checkQuota:", error);
    // If we can't check quota, allow the request to proceed (fail open)
    // This prevents the token system from blocking all chats if there's an issue
    return { allowed: true };
  }
}
