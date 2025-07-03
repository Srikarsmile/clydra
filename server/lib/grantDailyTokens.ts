// @grant-40k - Daily token granting for first-time users (in-memory version)

const DAILY_CAP = 40_000;

// @grant-40k - In-memory storage for daily tokens (development only)
const dailyTokens = new Map<string, { tokens: number; expiry: number }>();

/**
 * Grant the daily free-tier tokens to a brand-new user.
 * Runs once on first page load after account creation.
 */
export async function grantDailyTokens(userId: string): Promise<void> {
  try {
    // @grant-40k - Validate userId to prevent errors
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.warn("Invalid userId provided to grantDailyTokens:", userId);
      return;
    }

    const key = `daily_${userId}`;
    const existing = dailyTokens.get(key);
    
    // Check if tokens already exist and haven't expired
    if (existing && Date.now() < existing.expiry) {
      return; // returning user → nothing to do
    }

    // Grant 40k tokens with 24h expiry
    const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    dailyTokens.set(key, { tokens: DAILY_CAP, expiry });
    
    console.log(`Granted ${DAILY_CAP} daily tokens to user ${userId}`);
  } catch (error) {
    // Fail silently to avoid blocking the application
    console.error("Error granting daily tokens:", error);
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
      console.warn("Invalid userId provided to getRemainingDailyTokens:", userId);
      return 0;
    }

    const key = `daily_${userId}`;
    const existing = dailyTokens.get(key);
    
    if (!existing || Date.now() >= existing.expiry) {
      // Clean up expired entry
      if (existing) {
        dailyTokens.delete(key);
      }
      return 0;
    }
    
    return existing.tokens;
  } catch (error) {
    console.error("Error getting remaining daily tokens:", error);
    return 0; // Fail safe
  }
}

/**
 * Consume daily tokens for a user
 * @grant-40k - Decrement tokens when user makes API calls
 */
export async function consumeDailyTokens(userId: string, tokensUsed: number): Promise<boolean> {
  try {
    // @grant-40k - Validate inputs
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.warn("Invalid userId provided to consumeDailyTokens:", userId);
      return true; // Fail open
    }

    if (!tokensUsed || tokensUsed <= 0 || !Number.isInteger(tokensUsed)) {
      console.warn("Invalid tokensUsed provided to consumeDailyTokens:", tokensUsed);
      return true; // Fail open
    }

    const key = `daily_${userId}`;
    const existing = dailyTokens.get(key);
    
    if (!existing || Date.now() >= existing.expiry) {
      // No tokens available or expired
      if (existing) {
        dailyTokens.delete(key);
      }
      return false;
    }
    
    if (existing.tokens < tokensUsed) {
      return false; // Not enough tokens
    }
    
    // Update token count
    existing.tokens -= tokensUsed;
    dailyTokens.set(key, existing);
    
    return true; // Successfully consumed tokens
  } catch (error) {
    console.error("Error consuming daily tokens:", error);
    return true; // Fail open - allow the request if something goes wrong
  }
}

// @grant-40k - Clean up expired tokens periodically (runs every hour)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of dailyTokens.entries()) {
    if (now >= value.expiry) {
      dailyTokens.delete(key);
    }
  }
}, 60 * 60 * 1000); // 1 hour 