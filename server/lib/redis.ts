// @grant-40k - Redis client configuration for daily token management
import { Redis } from "ioredis";

let redis: Redis;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
} else {
  // Development fallback - use local Redis or mock
  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    enableReadyCheck: false,
    maxRetriesPerRequest: 1,
    lazyConnect: true, // @grant-40k - Connect only when needed
  });
}

// @grant-40k - Handle Redis connection errors gracefully
redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});

export { redis }; 