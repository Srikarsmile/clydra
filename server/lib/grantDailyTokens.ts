// @grant-40k - Daily token granting for first-time users
import { redis } from "./redis";

const DAILY_CAP = 40_000;

/**
 * Grant the daily free-tier tokens to a brand-new user.
 * Runs once on first page load after account creation.
 */
export async function grantDailyTokens(userId: string): Promise<void> {
  try {
    // @grant-40k - Validate userId to prevent charCodeAt errors
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.warn("Invalid userId provided to grantDailyTokens:", userId);
      return;
    }

    const key = `daily_${userId}`;
    const exists = await redis.exists(key);
    if (exists) return; // returning user → nothing to do

    await redis.set(key, DAILY_CAP, "EX", 60 * 60 * 24); // 24 h TTL
  } catch (error) {
    // Fail silently to avoid blocking the application if Redis is unavailable
    console.error("Error granting daily tokens:", error);
  }
}

/**
 * Get remaining daily tokens for a user from Redis
 * @grant-40k - Used for sidebar token gauge display
 */
export async function getRemainingDailyTokens(userId: string): Promise<number> {
  try {
    // @grant-40k - Validate userId to prevent charCodeAt errors
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.warn("Invalid userId provided to getRemainingDailyTokens:", userId);
      return 0;
    }

    const key = `daily_${userId}`;
    const remaining = await redis.get(key);
    return remaining ? parseInt(remaining, 10) : 0;
  } catch (error) {
    console.error("Error getting remaining daily tokens:", error);
    return 0; // Fail safe - return 0 if Redis is unavailable
  }
}

/**
 * Consume daily tokens for a user
 * @grant-40k - Decrement tokens when user makes API calls
 */
export async function consumeDailyTokens(userId: string, tokensUsed: number): Promise<boolean> {
  try {
    // @grant-40k - Validate userId to prevent charCodeAt errors
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.warn("Invalid userId provided to consumeDailyTokens:", userId);
      return true; // Fail open
    }

    // @grant-40k - Validate tokensUsed
    if (!tokensUsed || tokensUsed <= 0 || !Number.isInteger(tokensUsed)) {
      console.warn("Invalid tokensUsed provided to consumeDailyTokens:", tokensUsed);
      return true; // Fail open
    }

    const key = `daily_${userId}`;
    const remaining = await redis.get(key);
    
    if (!remaining) {
      return false; // No tokens available
    }
    
    const currentTokens = parseInt(remaining, 10);
    if (currentTokens < tokensUsed) {
      return false; // Not enough tokens
    }
    
    const newValue = currentTokens - tokensUsed;
    const ttl = await redis.ttl(key);
    
    if (ttl > 0) {
      await redis.set(key, newValue, "EX", ttl); // Preserve existing TTL
    } else {
      await redis.set(key, newValue, "EX", 60 * 60 * 24); // Reset to 24h if no TTL
    }
    
    return true; // Successfully consumed tokens
  } catch (error) {
    console.error("Error consuming daily tokens:", error);
    return true; // Fail open - allow the request if Redis is unavailable
  }
} 