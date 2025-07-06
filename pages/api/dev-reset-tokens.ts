import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { grantDailyTokens } from "../../server/lib/grantDailyTokens";

// @security - Enhanced development endpoint protection
const DEV_REQUEST_LIMIT = 10; // Max requests per minute
const devRequestCounts = new Map<string, { count: number; resetTime: number }>();

function isValidDevRequest(req: NextApiRequest): { valid: boolean; error?: string } {
  // Environment check with additional validation
  if (process.env.NODE_ENV !== "development") {
    return { valid: false, error: "Only available in development" };
  }

  // Additional environment variable check for extra security
  if (!process.env.ENABLE_DEV_RESET_TOKENS) {
    return { valid: false, error: "Feature not enabled" };
  }

  // IP validation with more robust checking - fix security vulnerabilities
  const allowedIPs = process.env.DEV_ALLOWED_IPS?.split(",").map(ip => ip.trim()) || [
    "127.0.0.1",
    "::1"
  ];
  
  const clientIP = 
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "";

  const normalizedIP = clientIP.replace(/^::ffff:/, ''); // Remove IPv6 prefix
  
  // @security - Fix IP validation bypass vulnerabilities
  // Remove dangerous .includes() check and use exact matching
  const isAllowedIP = allowedIPs.some(allowedIP => {
    // Exact match
    if (normalizedIP === allowedIP) return true;
    
    // Special handling for localhost variants
    if (allowedIP === "localhost" && (normalizedIP === "127.0.0.1" || normalizedIP === "::1")) {
      return true;
    }
    
    // IPv6 localhost variants
    if (allowedIP === "::1" && normalizedIP === "::1") return true;
    if (allowedIP === "127.0.0.1" && normalizedIP === "127.0.0.1") return true;
    
    return false;
  });
  
  if (!isAllowedIP) {
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

function logSecurityEvent(event: string, details: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${event}:`, JSON.stringify(details, null, 2));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // @security - Enhanced validation
  const validation = isValidDevRequest(req);
  if (!validation.valid) {
    logSecurityEvent("DEV_TOKENS_ACCESS_DENIED", {
      ip: req.socket.remoteAddress,
      headers: req.headers,
      error: validation.error
    });
    return res.status(403).json({ error: validation.error });
  }

  // @security - Set comprehensive security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      logSecurityEvent("DEV_TOKENS_UNAUTHORIZED", {
        ip: req.socket.remoteAddress,
        headers: req.headers
      });
      return res.status(401).json({ error: "Unauthorized" });
    }

    // @security - Validate userId format
    if (typeof userId !== 'string' || userId.length < 10 || userId.length > 100) {
      logSecurityEvent("DEV_TOKENS_INVALID_USER_ID", {
        ip: req.socket.remoteAddress,
        userId: userId ? '[REDACTED]' : 'null'
      });
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // @security - Log all valid requests
    logSecurityEvent("DEV_TOKENS_REQUEST", {
      ip: req.socket.remoteAddress,
      userId: '[REDACTED]'
    });

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
