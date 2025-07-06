import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { grantDailyTokens } from "../../server/lib/grantDailyTokens";

// @security - Enhanced development endpoint protection
const DEV_REQUEST_LIMIT = 10; // Max requests per minute
const devRequestCounts = new Map<string, { count: number; resetTime: number }>();

function isValidDevRequest(req: NextApiRequest): { valid: boolean; error?: string } {
  // Environment check
  if (process.env.NODE_ENV !== "development") {
    return { valid: false, error: "Only available in development" };
  }

  // IP validation with more robust checking
  const allowedIPs = process.env.DEV_ALLOWED_IPS?.split(",") || [
    "127.0.0.1",
    "::1",
    "localhost"
  ];
  
  const clientIP = 
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "";

  const normalizedIP = clientIP.replace(/^::ffff:/, ''); // Remove IPv6 prefix
  
  if (!allowedIPs.some(allowedIP => 
    normalizedIP === allowedIP || 
    normalizedIP.includes(allowedIP) ||
    allowedIP === "localhost" && (normalizedIP === "127.0.0.1" || normalizedIP === "::1")
  )) {
    return { valid: false, error: "IP not allowed" };
  }

  // Rate limiting for dev endpoint
  const now = Date.now();
  const key = `dev-${normalizedIP}`;
  const limit = devRequestCounts.get(key);

  if (!limit || now > limit.resetTime) {
    devRequestCounts.set(key, { count: 1, resetTime: now + 60000 });
    return { valid: true };
  }

  if (limit.count >= DEV_REQUEST_LIMIT) {
    return { valid: false, error: "Too many requests" };
  }

  limit.count++;
  return { valid: true };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // @security - Enhanced validation
  const validation = isValidDevRequest(req);
  if (!validation.valid) {
    return res.status(403).json({ error: validation.error });
  }

  // @security - Set security headers even for dev endpoints
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // @security - Validate userId format
    if (typeof userId !== 'string' || userId.length < 10 || userId.length > 100) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Development user IDs for testing
    const devUserIds = [userId]; // Add more test user IDs as needed

    for (const userId of devUserIds) {
      await grantDailyTokens(userId);
    }

    return res.status(200).json({
      message: `Granted 80,000 tokens to ${devUserIds.length} development users`,
      users: devUserIds,
      tokens: 80000,
    });
  } catch (error) {
    console.error("Error resetting development tokens:", error);
    return res.status(500).json({ error: "Failed to reset tokens" });
  }
}
