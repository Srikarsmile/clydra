/**
 * @clydra-core
 * Convo Core - Chat Usage Tracking Utilities
 *
 * Provides functionality for tracking chat messages and enforcing daily limits
 * on the Free tier (40 messages/day).
 */

import { supabaseAdmin } from "../../lib/supabase";

const DAILY_MESSAGE_LIMIT = 40;

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

/**
 * Get the start of the current day in IST (Indian Standard Time)
 */
function getTodayMidnightIST(): Date {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);

  // Set to midnight IST
  istNow.setHours(0, 0, 0, 0);

  // Convert back to UTC for database storage
  return new Date(istNow.getTime() - istOffset);
}

/**
 * Get daily chat message count for a user since midnight IST
 */
export async function getDailyChatCount(userId: string): Promise<number> {
  try {
    // Normalize user ID (handle both Clerk ID and Supabase UUID)
    const supabaseUserId = await normalizeUserId(userId);
    if (!supabaseUserId) {
      console.error("User not found for daily chat count:", userId);
      return 0;
    }

    const todayMidnight = getTodayMidnightIST();

    const { data, error } = await supabaseAdmin
      .from("chat_history")
      .select("messages")
      .eq("user_id", supabaseUserId)
      .gte("last_message_at", todayMidnight.toISOString());

    if (error) {
      console.error("Error fetching daily chat count:", error);
      return 0;
    }

    // Count total messages from all conversations today
    let totalMessages = 0;
    if (data) {
      for (const chat of data) {
        if (chat.messages && Array.isArray(chat.messages)) {
          // Count user messages only (role: "user")
          const userMessages = chat.messages.filter(
            (msg: any) => msg.role === "user"
          );
          totalMessages += userMessages.length;
        }
      }
    }

    return totalMessages;
  } catch (error) {
    console.error("Error getting daily chat count:", error);
    return 0;
  }
}

/**
 * Increment chat count for a user (creates new chat history entry)
 */
export async function incChatCount(
  userId: string,
  messageCount: number = 1
): Promise<void> {
  try {
    // This will be called when a new chat conversation is created
    // The actual message counting is done by getDailyChatCount
    // which reads from the chat_history table
    // For now, we don't need to do anything here as messages
    // are tracked via the chat_history table
    // Chat count tracking is handled via chat_history table
  } catch (error) {
    console.error("Error incrementing chat count:", error);
  }
}

/**
 * Check if user has exceeded daily message limit
 */
export async function hasExceededDailyLimit(userId: string): Promise<boolean> {
  try {
    const dailyCount = await getDailyChatCount(userId);
    return dailyCount >= DAILY_MESSAGE_LIMIT;
  } catch (error) {
    console.error("Error checking daily limit:", error);
    return false; // Allow on error to prevent blocking users
  }
}

/**
 * Get remaining messages for today
 */
export async function getRemainingMessages(userId: string): Promise<number> {
  try {
    const dailyCount = await getDailyChatCount(userId);
    const remaining = Math.max(0, DAILY_MESSAGE_LIMIT - dailyCount);
    return remaining;
  } catch (error) {
    console.error("Error getting remaining messages:", error);
    return DAILY_MESSAGE_LIMIT; // Return full limit on error
  }
}

/**
 * Update usage meter with token usage
 */
export async function updateUsageMeter(
  userId: string,
  chatTokens: number
): Promise<void> {
  try {
    // Normalize user ID (handle both Clerk ID and Supabase UUID)
    const supabaseUserId = await normalizeUserId(userId);
    if (!supabaseUserId) {
      console.error("User not found for usage meter:", userId);
      return;
    }

    // First, try to get existing usage meter
    const { data: existingUsage, error: selectError } = await supabaseAdmin
      .from("usage_meter")
      .select("*")
      .eq("user_id", supabaseUserId)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // Error other than "no rows found"
      console.error("Error fetching usage meter:", selectError);
      return;
    }

    if (existingUsage) {
      // Update existing record
      const { error: updateError } = await supabaseAdmin
        .from("usage_meter")
        .update({
          chat_tokens: (existingUsage.chat_tokens || 0) + chatTokens,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", supabaseUserId);

      if (updateError) {
        console.error("Error updating usage meter:", updateError);
      }
    } else {
      // Create new record
      const { error: insertError } = await supabaseAdmin
        .from("usage_meter")
        .insert({
          user_id: supabaseUserId,
          chat_tokens: chatTokens,
        });

      if (insertError) {
        console.error("Error creating usage meter:", insertError);
      }
    }
  } catch (error) {
    console.error("Error updating usage meter:", error);
  }
}

export { DAILY_MESSAGE_LIMIT };
