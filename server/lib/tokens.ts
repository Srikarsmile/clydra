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
        // Don't throw - just log and continue
        return;
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
  const monthStr = month.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  try {
    const { data, error } = await supabaseAdmin
      .from("token_usage")
      .select("tokens_used")
      .eq("user_id", userId)
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
  return plan === "pro" ? CAP_PRO : CAP_FREE_DAILY; // free = 40k / day handled elsewhere
}

// @token-meter - Check if user has exceeded quota before making request
export async function checkQuota(userId: string, requestTokens: number, plan: "free" | "pro"): Promise<{allowed: boolean, reason?: string}> {
  try {
    const used = await getUsage(userId);
    const cap = getCap(plan);
    
    if (used + requestTokens > cap) {
      return { 
        allowed: false, 
        reason: `Quota exceeded. Used ${used.toLocaleString()} + ${requestTokens.toLocaleString()} would exceed ${cap.toLocaleString()} tokens.`
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