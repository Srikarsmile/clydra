// @dev-migration - Development endpoint to migrate old threads
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../lib/supabase";

// @security - Enhanced development endpoint protection
const DEV_REQUEST_LIMIT = 5; // Lower limit for destructive operations
const devRequestCounts = new Map<string, { count: number; resetTime: number }>();

function isValidDevRequest(req: NextApiRequest): { valid: boolean; error?: string } {
  // Environment check with additional validation
  if (process.env.NODE_ENV !== "development") {
    return { valid: false, error: "Not found" };
  }

  // Additional environment variable check for extra security
  if (!process.env.ENABLE_DEV_MIGRATION) {
    return { valid: false, error: "Not found" };
  }

  // IP validation - reuse same logic as dev-reset-tokens for consistency
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
    return { valid: false, error: "Access denied" };
  }

  // Rate limiting for dev endpoint (more restrictive for destructive operations)
  const now = Date.now();
  const key = `dev-migration-${normalizedIP}`;
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
    logSecurityEvent("DEV_MIGRATION_ACCESS_DENIED", {
      ip: req.socket.remoteAddress,
      headers: req.headers,
      error: validation.error
    });
    return res.status(404).json({ error: validation.error });
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
      logSecurityEvent("DEV_MIGRATION_UNAUTHORIZED", {
        ip: req.socket.remoteAddress,
        headers: req.headers
      });
      return res.status(401).json({ error: "Unauthorized" });
    }

    // @security - Validate userId format
    if (typeof userId !== 'string' || userId.length < 10 || userId.length > 100) {
      logSecurityEvent("DEV_MIGRATION_INVALID_USER_ID", {
        ip: req.socket.remoteAddress,
        userId: userId ? '[REDACTED]' : 'null'
      });
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // @security - Validate request body exists and action parameter
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { action, confirmationToken } = req.body;

    // @security - Validate action parameter
    if (typeof action !== 'string' || !['diagnose', 'migrate'].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Use 'diagnose' or 'migrate'" });
    }

    // @security - Require confirmation token for destructive migrate operation
    if (action === 'migrate') {
      if (!confirmationToken || confirmationToken !== process.env.DEV_MIGRATION_CONFIRMATION_TOKEN) {
        logSecurityEvent("DEV_MIGRATION_MISSING_CONFIRMATION", {
          ip: req.socket.remoteAddress,
          userId: '[REDACTED]',
          action: action
        });
        return res.status(403).json({ 
          error: "Missing or invalid confirmation token for destructive operation",
          hint: "Set DEV_MIGRATION_CONFIRMATION_TOKEN environment variable"
        });
      }
    }

    // @security - Log all valid requests
    logSecurityEvent("DEV_MIGRATION_REQUEST", {
      ip: req.socket.remoteAddress,
      userId: '[REDACTED]',
      action: action
    });

    if (action === "diagnose") {
      // Diagnose the current state
      console.log("🔍 Diagnosing thread migration issues...");

      // Check for threads with invalid user_id format
      const { data: invalidThreads, error: invalidError } = await supabaseAdmin
        .from("threads")
        .select("id, user_id, title, created_at")
        .not("user_id", "is", null);

      if (invalidError) {
        throw invalidError;
      }

      // Separate valid UUIDs from invalid ones
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validThreads = invalidThreads.filter((t) =>
        uuidPattern.test(t.user_id)
      );
      const clerkIdThreads = invalidThreads.filter(
        (t) => !uuidPattern.test(t.user_id)
      );

      // Check if Clerk ID threads can be mapped to users
      const mappableThreads = [];
      const orphanedThreads = [];

      for (const thread of clerkIdThreads) {
        const { data: user, error: userError } = await supabaseAdmin
          .from("users")
          .select("id, clerk_id")
          .eq("clerk_id", thread.user_id)
          .single();

        if (user && !userError) {
          mappableThreads.push({ ...thread, supabase_uuid: user.id });
        } else {
          orphanedThreads.push(thread);
        }
      }

      return res.status(200).json({
        diagnosis: {
          total_threads: invalidThreads.length,
          valid_uuid_threads: validThreads.length,
          clerk_id_threads: clerkIdThreads.length,
          mappable_threads: mappableThreads.length,
          orphaned_threads: orphanedThreads.length,
        },
        details: {
          mappable_threads: mappableThreads.slice(0, 5), // Show first 5 examples
          orphaned_threads: orphanedThreads.slice(0, 5), // Show first 5 examples
        },
      });
    }

    if (action === "migrate") {
      // Perform the migration
      console.log("🔄 Starting thread migration...");

      // Step 1: Update threads where user_id is a Clerk ID
      const { data: updateResult, error: updateError } =
        await supabaseAdmin.rpc("migrate_threads_to_uuids");

      if (updateError) {
        // If the RPC doesn't exist, do it manually
        console.log("RPC not available, doing manual migration...");

        // Get all threads with Clerk IDs
        const { data: clerkThreads, error: fetchError } = await supabaseAdmin
          .from("threads")
          .select("id, user_id")
          .not("user_id", "is", null);

        if (fetchError) {
          throw fetchError;
        }

        const uuidPattern =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const threadsToUpdate = clerkThreads.filter(
          (t) => !uuidPattern.test(t.user_id)
        );

        let migratedCount = 0;
        let errorCount = 0;

        for (const thread of threadsToUpdate) {
          try {
            // Find the user with this Clerk ID
            const { data: user, error: userError } = await supabaseAdmin
              .from("users")
              .select("id")
              .eq("clerk_id", thread.user_id)
              .single();

            if (user && !userError) {
              // Update the thread to use the Supabase UUID
              const { error: updateThreadError } = await supabaseAdmin
                .from("threads")
                .update({ user_id: user.id })
                .eq("id", thread.id);

              if (updateThreadError) {
                console.error(
                  `Failed to update thread ${thread.id}:`,
                  updateThreadError
                );
                errorCount++;
              } else {
                migratedCount++;
              }
            } else {
              console.log(`No user found for Clerk ID ${thread.user_id}`);
              errorCount++;
            }
          } catch (error) {
            console.error(`Error processing thread ${thread.id}:`, error);
            errorCount++;
          }
        }

        return res.status(200).json({
          migration_complete: true,
          migrated_threads: migratedCount,
          errors: errorCount,
          total_processed: threadsToUpdate.length,
        });
      }

      return res.status(200).json({
        migration_complete: true,
        result: updateResult,
      });
    }

    return res
      .status(400)
      .json({ error: "Invalid action. Use 'diagnose' or 'migrate'" });
  } catch (error) {
    console.error("Migration API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Migration failed",
    });
  }
}
