// @grant-40k - Daily token granting for users with persistent database storage
import { supabaseAdmin } from "../../lib/supabase";

const DAILY_CAP = 40_000;

/**
 * Grant the daily free-tier tokens to a user.
 * This runs once per day per user, persisted in database.
 */
export async function grantDailyTokens(userId: string): Promise<void> {
  try {
    // @grant-40k - Validate userId to prevent errors
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.warn("Invalid userId provided to grantDailyTokens:", userId);
      return;
    }

    // Get today's date string (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];

    // Check if user already has tokens for today
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("daily_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is expected for new day
      console.error("Error checking existing daily tokens:", fetchError);
      return;
    }

    if (existing) {
      // User already has tokens for today
      return;
    }

    // Grant new daily tokens
    const { error: insertError } = await supabaseAdmin
      .from("daily_tokens")
      .insert({
        user_id: userId,
        date: today,
        tokens_granted: DAILY_CAP,
        tokens_remaining: DAILY_CAP,
      });

    if (insertError) {
      console.error("Error granting daily tokens:", insertError);
      return;
    }

    console.log(
      `Granted ${DAILY_CAP} daily tokens to user ${userId} for ${today}`
    );
  } catch (error) {
    // Fail silently to avoid blocking the application
    console.error("Error granting daily tokens:", error);
  }
}

/**
 * Force reset daily tokens for a user (development helper)
 */
export async function resetDailyTokens(userId: string): Promise<void> {
  try {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.warn("Invalid userId provided to resetDailyTokens:", userId);
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    // Delete existing record for today and create fresh one
    await supabaseAdmin
      .from("daily_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("date", today);

    const { error } = await supabaseAdmin.from("daily_tokens").insert({
      user_id: userId,
      date: today,
      tokens_granted: DAILY_CAP,
      tokens_remaining: DAILY_CAP,
    });

    if (error) {
      console.error("Error resetting daily tokens:", error);
      return;
    }

    console.log(`Reset daily tokens to ${DAILY_CAP} for user ${userId}`);
  } catch (error) {
    console.error("Error resetting daily tokens:", error);
  }
}

/**
 * Get remaining daily tokens for a user
 * @grant-40k - Used for sidebar token gauge display
 */
export async function getRemainingDailyTokens(userId: string): Promise<number> {
  try {
    // @grant-40k - Validate userId
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.warn(
        "Invalid userId provided to getRemainingDailyTokens:",
        userId
      );
      return 0;
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("daily_tokens")
      .select("tokens_remaining")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error getting remaining daily tokens:", error);
      return 0;
    }

    if (!data) {
      // No tokens for today yet - grant them first
      await grantDailyTokens(userId);
      return DAILY_CAP;
    }

    return data.tokens_remaining || 0;
  } catch (error) {
    console.error("Error getting remaining daily tokens:", error);
    return 0; // Fail safe
  }
}

/**
 * Consume daily tokens for a user
 * @grant-40k - Decrement tokens when user makes API calls
 */
export async function consumeDailyTokens(
  userId: string,
  tokensUsed: number
): Promise<boolean> {
  try {
    // @grant-40k - Validate inputs
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.warn("Invalid userId provided to consumeDailyTokens:", userId);
      return true; // Fail open
    }

    if (!tokensUsed || tokensUsed <= 0 || !Number.isInteger(tokensUsed)) {
      console.warn(
        "Invalid tokensUsed provided to consumeDailyTokens:",
        tokensUsed
      );
      return true; // Fail open
    }

    const today = new Date().toISOString().split("T")[0];

    // Get current token balance
    const { data: current, error: fetchError } = await supabaseAdmin
      .from("daily_tokens")
      .select("tokens_remaining")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching daily tokens for consumption:", fetchError);
      return true; // Fail open
    }

    if (!current) {
      // No tokens for today - grant them first
      await grantDailyTokens(userId);
      // Now check again
      const { data: newCurrent, error: newFetchError } = await supabaseAdmin
        .from("daily_tokens")
        .select("tokens_remaining")
        .eq("user_id", userId)
        .eq("date", today)
        .single();

      if (newFetchError || !newCurrent) {
        console.error("Error getting tokens after granting:", newFetchError);
        return true; // Fail open
      }

      if (newCurrent.tokens_remaining < tokensUsed) {
        return false; // Not enough tokens
      }

      // Update token count
      const { error: updateError } = await supabaseAdmin
        .from("daily_tokens")
        .update({
          tokens_remaining: newCurrent.tokens_remaining - tokensUsed,
        })
        .eq("user_id", userId)
        .eq("date", today);

      if (updateError) {
        console.error("Error updating token count:", updateError);
        return true; // Fail open
      }

      console.log(
        `Consumed ${tokensUsed} tokens for user ${userId}. Remaining: ${newCurrent.tokens_remaining - tokensUsed}`
      );
      return true;
    }

    if (current.tokens_remaining < tokensUsed) {
      console.log(
        `Insufficient tokens for user ${userId}. Need: ${tokensUsed}, Have: ${current.tokens_remaining}`
      );
      return false; // Not enough tokens
    }

    // Update token count
    const { error: updateError } = await supabaseAdmin
      .from("daily_tokens")
      .update({
        tokens_remaining: current.tokens_remaining - tokensUsed,
      })
      .eq("user_id", userId)
      .eq("date", today);

    if (updateError) {
      console.error("Error updating token count:", updateError);
      return true; // Fail open
    }

    console.log(
      `Consumed ${tokensUsed} tokens for user ${userId}. Remaining: ${current.tokens_remaining - tokensUsed}`
    );
    return true; // Successfully consumed tokens
  } catch (error) {
    console.error("Error consuming daily tokens:", error);
    return true; // Fail open - allow the request if something goes wrong
  }
}
