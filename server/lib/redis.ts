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

  async set(key: string, value: string | number, mode?: string, duration?: number): Promise<string> {
    const expiry = mode === "EX" && duration ? Date.now() + (duration * 1000) : undefined;
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
    // Mock event handler
  }
}

let redis: Redis | MockRedis;

// @grant-40k - Initialize Redis with fallback to mock for development
try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
  } else if (process.env.NODE_ENV === "production") {
    // In production, require Redis configuration
    throw new Error("Redis configuration required in production");
  } else {
    // Development fallback - try local Redis first, then mock
    redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true, // @grant-40k - Connect only when needed
      connectTimeout: 1000, // Quick timeout for dev
      commandTimeout: 1000,
    });

    // @grant-40k - Test connection and fallback to mock if Redis unavailable
    redis.ping().catch(() => {
      console.warn("Redis unavailable in development, using mock Redis client");
      redis = new MockRedis();
    });
  }

  // @grant-40k - Handle Redis connection errors gracefully
  if (redis instanceof Redis) {
    redis.on("error", (error) => {
      console.error("Redis connection error:", error);
      // In development, fallback to mock
      if (process.env.NODE_ENV !== "production") {
        console.warn("Falling back to mock Redis client");
        redis = new MockRedis();
      }
    });
  }
} catch (error) {
  console.error("Failed to initialize Redis:", error);
  // Fallback to mock Redis
  redis = new MockRedis();
}

export { redis }; 