// @threads - Thread management API endpoint
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../lib/supabase";
import { getOrCreateUser } from "../../lib/user-utils";
import { logger } from "../../lib/logger";
import { z } from "zod";

// Validation schemas
const CreateThreadSchema = z.object({
  title: z.string().min(1, "Thread title is required").max(200, "Title too long"),
  firstMessage: z.string().min(1, "First message is required").max(10000, "Message too long").optional(),
});

const UpdateThreadSchema = z.object({
  title: z.string().min(1, "Thread title is required").max(200, "Title too long").optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set timeout to prevent hanging requests
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      logger.warn("Request timeout, returning empty threads", { endpoint: "/api/threads" });
      res.status(200).json([]);
    }
  }, 10000); // 10 second timeout

  try {
    const { userId } = getAuth(req);

    logger.info("Threads API request", {
      method: req.method,
      userId: userId || "undefined",
      endpoint: "/api/threads"
    });

    if (!userId) {
      logger.warn("Unauthorized threads API access", { endpoint: "/api/threads" });
      clearTimeout(timeout);
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get or create user in Supabase with timeout handling
    let userResult;
    try {
      userResult = await Promise.race([
        getOrCreateUser(userId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User lookup timeout')), 5000)
        )
      ]) as any;
    } catch (timeoutError) {
      logger.error("User lookup timeout", timeoutError, { userId });
      clearTimeout(timeout);
      return res.status(200).json([]); // Return empty threads instead of error
    }

    if (!userResult.success || !userResult.user) {
      logger.error("Failed to get or create user in threads API", userResult.error, {
        userId,
        endpoint: "/api/threads"
      });
      clearTimeout(timeout);
      return res.status(500).json({ error: "Failed to authenticate user" });
    }

    logger.info("User authenticated for threads API", {
      userId,
      supabaseUserId: userResult.user.id,
      endpoint: "/api/threads"
    });

  if (req.method === "GET") {
    try {
      // @ui-polish - Add message count via subquery
      const { data, error } = await supabaseAdmin
        .from("threads")
        .select(
          `
          *,
          msg_count:messages(count)
        `
        )
        .eq("user_id", userResult.user.id)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error fetching threads", error, {
          userId,
          supabaseUserId: userResult.user.id,
          endpoint: "/api/threads"
        });
        
        // Check if it's a connection error (Supabase down)
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.code === 'ECONNREFUSED') {
          logger.warn("Database connection issue, returning empty threads", {
            userId,
            endpoint: "/api/threads",
            error: error.message
          });
          return res.status(200).json([]);
        }
        
        throw error;
      }

      logger.info("Threads fetched successfully", {
        userId,
        threadCount: data?.length || 0,
        endpoint: "/api/threads"
      });
      clearTimeout(timeout);
      res.status(200).json(data || []);
    } catch (error) {
      logger.error("Failed to fetch threads", error, {
        userId,
        endpoint: "/api/threads"
      });
      
      // Return empty array instead of error when database is unavailable
      // This allows the UI to still function during outages
      logger.warn("Returning empty threads due to database error", {
        userId,
        endpoint: "/api/threads"
      });
      clearTimeout(timeout);
      res.status(200).json([]);
    }
  } else if (req.method === "POST") {
    try {
      // Validate request body if present
      let validatedData = {};
      if (req.body && Object.keys(req.body).length > 0) {
        const validation = CreateThreadSchema.safeParse(req.body);
        if (!validation.success) {
          logger.warn("Invalid thread creation data", {
            errors: validation.error.errors,
            userId,
            endpoint: "/api/threads"
          });
          clearTimeout(timeout);
          return res.status(400).json({
            error: "Invalid request",
            details: validation.error.errors
          });
        }
        validatedData = validation.data;
      }

      const { data, error } = await supabaseAdmin
        .from("threads")
        .insert({ 
          user_id: userResult.user.id,
          ...validatedData
        })
        .select("id, created_at")
        .single();

      if (error) {
        logger.error("Error creating thread", error, {
          userId,
          supabaseUserId: userResult.user.id,
          endpoint: "/api/threads"
        });
        throw error;
      }

      logger.info("Thread created successfully", {
        userId,
        threadId: data.id,
        endpoint: "/api/threads"
      });
      clearTimeout(timeout);
      res.status(201).json({ id: data.id });
    } catch (error) {
      logger.error("Failed to create thread", error, {
        userId,
        endpoint: "/api/threads"
      });
      clearTimeout(timeout);
      res.status(500).json({ error: "Failed to create thread" });
    }
  } else if (req.method === "DELETE") {
    // Improved thread deletion functionality with better error handling
    try {
      // Validate thread ID
      const threadIdValidation = z.object({
        threadId: z.string().uuid("Invalid thread ID")
      }).safeParse(req.body);

      if (!threadIdValidation.success) {
        logger.warn("Invalid thread deletion request", {
          errors: threadIdValidation.error.errors,
          userId,
          endpoint: "/api/threads"
        });
        clearTimeout(timeout);
        return res.status(400).json({ 
          error: "Invalid request",
          details: threadIdValidation.error.errors
        });
      }

      const { threadId } = threadIdValidation.data;

      // Verify thread exists and belongs to user before deletion
      const { data: existingThread, error: verifyError } = await supabaseAdmin
        .from("threads")
        .select("id, user_id")
        .eq("id", threadId)
        .eq("user_id", userResult.user.id)
        .single();

      if (verifyError) {
        logger.error("Error verifying thread ownership", verifyError, {
          userId,
          threadId,
          endpoint: "/api/threads"
        });
        if (verifyError.code === "PGRST116") {
          // No rows returned
          clearTimeout(timeout);
          return res
            .status(404)
            .json({ error: "Thread not found or access denied" });
        }
        throw verifyError;
      }

      if (!existingThread) {
        logger.warn("Thread not found or access denied", {
          threadId,
          userId,
          supabaseUserId: userResult.user.id,
          endpoint: "/api/threads"
        });
        clearTimeout(timeout);
        return res
          .status(404)
          .json({ error: "Thread not found or access denied" });
      }

      // First delete all messages in the thread
      const { error: messagesError } = await supabaseAdmin
        .from("messages")
        .delete()
        .eq("thread_id", threadId);

      if (messagesError) {
        logger.warn("Failed to delete messages during thread deletion", {
          threadId,
          userId,
          endpoint: "/api/threads",
          error: messagesError
        });
        // Don't fail the whole operation if message deletion fails
        // Messages will be cleaned up by cascade delete
      }

      // Then delete the thread
      const { error: deleteError } = await supabaseAdmin
        .from("threads")
        .delete()
        .eq("id", threadId)
        .eq("user_id", userResult.user.id);

      if (deleteError) {
        logger.error("Failed to delete thread", deleteError, {
          threadId,
          userId,
          endpoint: "/api/threads"
        });
        throw deleteError;
      }

      logger.info("Thread deleted successfully", {
        threadId,
        userId,
        endpoint: "/api/threads"
      });
      clearTimeout(timeout);
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error("Failed to delete thread - full error", error, {
        userId,
        endpoint: "/api/threads"
      });
      clearTimeout(timeout);
      res.status(500).json({
        error: "Failed to delete thread",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    logger.warn("Method not allowed for threads API", {
      method: req.method,
      endpoint: "/api/threads"
    });
    clearTimeout(timeout);
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    res.status(405).json({ error: "Method not allowed" });
  }
  } catch (outerError) {
    logger.error("Threads API outer error", outerError, { endpoint: "/api/threads" });
    clearTimeout(timeout);
    if (!res.headersSent) {
      res.status(200).json([]); // Return empty threads on any error
    }
  }
}
