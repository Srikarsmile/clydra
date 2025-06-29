// @token-meter - Token usage tracking and quota management
import { supabaseAdmin } from "../../lib/supabase";
import { startOfMonth } from "date-fns";

const CAP_PRO = 1_500_000;        // 1.5 M / month
const CAP_FREE_DAILY = 40_000;    // 40k / day for free tier

export async function addTokens(userId: string, tokens: number): Promise<void> {
  const month = startOfMonth(new Date());
  const monthStr = month.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  try {
    // First try to get existing record
    const { data: existing } = await supabaseAdmin
      .from("token_usage")
      .select("tokens_used")
      .eq("user_id", userId)
      .eq("month_start", monthStr)
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabaseAdmin
        .from("token_usage")
        .update({
          tokens_used: existing.tokens_used + tokens
        })
        .eq("user_id", userId)
        .eq("month_start", monthStr);

      if (error) {
        console.error("Error updating tokens:", error);
        throw new Error(`Failed to update tokens: ${error.message}`);
      }
    } else {
      // Insert new record
      const { error } = await supabaseAdmin
        .from("token_usage")
        .insert({
          user_id: userId,
          month_start: monthStr,
          tokens_used: tokens
        });

      if (error) {
        console.error("Error inserting tokens:", error);
        throw new Error(`Failed to insert tokens: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("Error in addTokens:", error);
    throw error;
  }
}

export async function getUsage(userId: string): Promise<number> {
  const month = startOfMonth(new Date());
  const monthStr = month.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  try {
    const { data, error } = await supabaseAdmin
      .from("token_usage")
      .select("tokens_used")
      .eq("user_id", userId)
      .eq("month_start", monthStr)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
      console.error("Error getting usage:", error);
      throw new Error(`Failed to get usage: ${error.message}`);
    }

    return data?.tokens_used ?? 0;
  } catch (error) {
    console.error("Error in getUsage:", error);
    return 0; // Return 0 on error to be safe
  }
}

export function getCap(plan: "free" | "pro"): number {
  return plan === "pro" ? CAP_PRO : CAP_FREE_DAILY; // free = 40k / day handled elsewhere
}

// @token-meter - Check if user has exceeded quota before making request
export async function checkQuota(userId: string, requestTokens: number, plan: "free" | "pro" = "pro"): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const used = await getUsage(userId);
    const cap = getCap(plan);
    
    if (used + requestTokens > cap) {
      return {
        allowed: false,
        reason: `Quota exceeded. Used: ${used.toLocaleString()}, Request: ${requestTokens.toLocaleString()}, Cap: ${cap.toLocaleString()}`
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error("Error checking quota:", error);
    // On error, allow the request but log the issue
    return { allowed: true };
  }
} 