// @token-meter - Token usage tracking and quota management
import { supabaseAdmin } from "../../lib/supabase";
import { withDatabaseConnection, QueryBuilder } from "../../lib/connection-pool";
import { logger } from "../../lib/logger";
import { startOfMonth } from "date-fns";
import { ChatModel } from "../../types/chatModels";

// @model-multiplier - Model-specific token multipliers for streamlined model selection
export const MODEL_MULTIPLIER: Record<string, number> = {
  // Free model
  "google/gemini-2.5-flash-preview": 1.0, // Default free model with 1.0x multiplier

  // Pro models with various multipliers
  "openai/gpt-4o": 2.0, // Premium model with 2.0x multiplier
  "anthropic/claude-sonnet-4": 1.5, // Claude 4 Sonnet with 1.5x multiplier
  "x-ai/grok-3": 1.5, // Premium model with 1.5x multiplier
  "google/gemini-2.5-pro": 1.0, // Standard pro model with 1.0x multiplier
  "mistralai/magistral-small-2506": 1.0, // Standard model with 1.0x multiplier
  "klusterai/meta-llama-3.3-70b-instruct-turbo": 1.2, // Large model with 1.2x multiplier
  "sarvam-m": 1.0, // Standard model with 1.0x multiplier

  // Deprecated models (will be migrated)
  "x-ai/grok-beta": 1.5, // Migrates to grok-3
  "google/gemini-2.5-pro-exp-03-25": 1.0, // Migrates to gemini-2.5-pro
  "anthropic/claude-3-5-sonnet-20241022": 1.5, // Migrates to claude-sonnet-4
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
export async function computeEffectiveTokens( // @fix-name - Renamed to avoid TDZ error
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
    return await withDatabaseConnection(async (client) => {
      const { data: user } = await client
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      return user?.id || null;
    });
  } catch (error) {
    logger.error("Error getting Supabase user ID", error, { clerkUserId });
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
  const effectiveTokenCount = model
    ? await computeEffectiveTokens(model, tokens, usedWebSearch)
    : tokens; // Fallback to raw tokens if model not specified

  try {
    // Normalize user ID (handle both Clerk ID and Supabase UUID)
    const supabaseUserId = await normalizeUserId(userId);
    if (!supabaseUserId) {
      logger.error("User not found for token tracking", undefined, { userId });
      return;
    }

    await withDatabaseConnection(async (client) => {
      // First try to get existing record
      const { data: existing } = await client
        .from("token_usage")
        .select("tokens_used")
        .eq("user_id", supabaseUserId)
        .eq("month_start", monthStr)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await client
          .from("token_usage")
          .update({
            tokens_used: existing.tokens_used + effectiveTokenCount,
          })
          .eq("user_id", supabaseUserId)
          .eq("month_start", monthStr);

        if (error) {
          logger.error("Error updating tokens", error, { 
            userId, 
            supabaseUserId, 
            effectiveTokenCount 
          });
          throw error;
        }
      } else {
        // Insert new record
        const { error } = await client.from("token_usage").insert({
          user_id: supabaseUserId,
          month_start: monthStr,
          tokens_used: effectiveTokenCount,
        });

        if (error) {
          logger.error("Error inserting tokens", error, { 
            userId, 
            supabaseUserId, 
            effectiveTokenCount 
          });
          throw error;
        }
      }

      logger.debug("Token usage updated", {
        userId,
        supabaseUserId,
        tokensAdded: effectiveTokenCount,
        model,
        usedWebSearch,
        monthStr
      });
    });
  } catch (error) {
    logger.error("Error in addTokens", error, { userId, tokens, model });
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
      logger.error("User not found for usage tracking", undefined, { userId });
      return 0;
    }

    return await withDatabaseConnection(async (client) => {
      const { data, error } = await client
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
        logger.error("Error getting usage", error, { userId, supabaseUserId });
        // Return 0 instead of throwing to prevent blocking the chat
        return 0;
      }

      const usage = data?.tokens_used ?? 0;
      logger.debug("Token usage retrieved", {
        userId,
        supabaseUserId,
        usage,
        monthStr
      });

      return usage;
    });
  } catch (error) {
    logger.error("Error in getUsage", error, { userId });
    // Return 0 to allow chat to continue even if token tracking fails
    return 0;
  }
}

// Get daily usage for better tracking
export async function getDailyUsage(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  try {
    // Normalize user ID (handle both Clerk ID and Supabase UUID)
    const supabaseUserId = await normalizeUserId(userId);
    if (!supabaseUserId) {
      logger.error("User not found for daily usage tracking", undefined, { userId });
      return 0;
    }

    return await withDatabaseConnection(async (client) => {
      const { data, error } = await client
        .from("daily_tokens")
        .select("tokens_granted, tokens_remaining")
        .eq("user_id", supabaseUserId)
        .eq("date", today)
        .single();

      // Handle table not exists or no rows found gracefully
      if (error && (error.code === "42P01" || error.code === "PGRST116")) {
        // 42P01 = table doesn't exist, PGRST116 = no rows found
        return 0;
      }

      if (error) {
        logger.error("Error getting daily usage", error, { userId, supabaseUserId });
        // Return 0 instead of throwing to prevent blocking the chat
        return 0;
      }

      const dailyUsage = (data?.tokens_granted ?? 0) - (data?.tokens_remaining ?? 0);
      logger.debug("Daily token usage retrieved", {
        userId,
        supabaseUserId,
        dailyUsage,
        today
      });

      return dailyUsage;
    });
  } catch (error) {
    logger.error("Error in getDailyUsage", error, { userId });
    // Return 0 to allow chat to continue even if token tracking fails
    return 0;
  }
}

export function getCap(plan: "free" | "pro"): number {
  // @pro-cap
  const PLAN_CAP = {
    free: 80_000, // daily
    pro: 1_000_000, // monthly
  };
  return PLAN_CAP[plan]; // free = 80k / day, pro = 1M / month
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
      ? await computeEffectiveTokens(model, requestTokens, usedWebSearch)
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
