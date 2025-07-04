// @grant-40k - Redis client configuration for daily token management
import { Redis } from "ioredis";

// @grant-40k - Mock Redis client for development when Redis is unavailable
class MockRedis {
  private storage = new Map<string, { value: string; expiry?: number }>();

  async exists(key: string): Promise<number> {
    const item = this.storage.get(key);
    if (!item) return 0;
    if (item.expiry && Date.now() > item.expiry) {
      this.storage.delete(key);
      return 0;
    }
    return 1;
  }

  async set(
    key: string,
    value: string | number,
    mode?: string,
    duration?: number
  ): Promise<string> {
    const expiry =
      mode === "EX" && duration ? Date.now() + duration * 1000 : undefined;
    this.storage.set(key, { value: String(value), expiry });
    return "OK";
  }

  async get(key: string): Promise<string | null> {
    const item = this.storage.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.storage.delete(key);
      return null;
    }
    return item.value;
  }

  async ttl(key: string): Promise<number> {
    const item = this.storage.get(key);
    if (!item || !item.expiry) return -1;
    const remaining = Math.floor((item.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  on(event: string, callback: (error: any) => void): void {
    // Mock event handler - no-op
  }
}

let redis: Redis | MockRedis;

// @grant-40k - Initialize Redis with development fallback
function initializeRedis(): Redis | MockRedis {
  // In development, always use MockRedis unless explicitly configured
  if (process.env.NODE_ENV !== "production" && !process.env.REDIS_URL) {
    console.log("Using MockRedis for development environment");
    return new MockRedis();
  }

  // Production or explicit Redis configuration
  if (process.env.REDIS_URL) {
    try {
      const redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableReadyCheck: false,
      });

      redisClient.on("error", (error) => {
        console.error("Redis connection error:", error);
      });

      return redisClient;
    } catch (error) {
      console.error("Failed to initialize Redis:", error);
      return new MockRedis();
    }
  }

  // Fallback to MockRedis
  console.log("No Redis configuration found, using MockRedis");
  return new MockRedis();
}

redis = initializeRedis();

export { redis };
