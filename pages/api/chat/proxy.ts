/**
 * @clydra-core
 * Convo Core - Chat Proxy API Endpoint
 *
 * REST endpoint for chat requests via OpenRouter
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import {
  processChatRequest,
  ChatError,
  ChatInput,
} from "../../../server/api/chat";

// @security - Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// @security - Input validation and sanitization
interface UnsafeInput {
  messages?: unknown[];
  model?: unknown;
  threadId?: unknown;
  enableWebSearch?: unknown;
  webSearchContextSize?: unknown;
  enableWikiGrounding?: unknown;
}

interface UnsafeMessage {
  role?: unknown;
  content?: unknown;
}

function sanitizeInput(input: unknown): ChatInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input format');
  }

  const unsafeInput = input as UnsafeInput;

  // Validate messages array
  if (!Array.isArray(unsafeInput.messages)) {
    throw new Error('Messages must be an array');
  }

  // Sanitize and validate each message
  const sanitizedMessages = unsafeInput.messages.map((msg: unknown, index: number) => {
    if (!msg || typeof msg !== 'object') {
      throw new Error(`Message at index ${index} is invalid`);
    }

    const unsafeMsg = msg as UnsafeMessage;

    // Validate role
    if (!['user', 'assistant', 'system'].includes(unsafeMsg.role as string)) {
      throw new Error(`Invalid role at message ${index}: ${unsafeMsg.role}`);
    }

    // Validate and limit content length
    if (typeof unsafeMsg.content !== 'string') {
      throw new Error(`Message content at index ${index} must be a string`);
    }

    if (unsafeMsg.content.length > 50000) { // 50KB limit per message
      throw new Error(`Message at index ${index} exceeds maximum length`);
    }

    // Basic content sanitization (remove potential script tags, etc.)
    const sanitizedContent = unsafeMsg.content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .trim();

    return {
      role: unsafeMsg.role as 'user' | 'assistant' | 'system',
      content: sanitizedContent,
    };
  });

  // Validate model
  if (typeof unsafeInput.model !== 'string' || unsafeInput.model.length > 100) {
    throw new Error('Invalid model specified');
  }

  // Validate optional fields
  const sanitizedInput: ChatInput = {
    messages: sanitizedMessages,
    model: unsafeInput.model as ChatInput['model'], // Will be validated by Zod schema
    threadId: typeof unsafeInput.threadId === 'string' ? unsafeInput.threadId : undefined,
    enableWebSearch: Boolean(unsafeInput.enableWebSearch),
    webSearchContextSize: ['low', 'medium', 'high'].includes(unsafeInput.webSearchContextSize as string) 
      ? (unsafeInput.webSearchContextSize as 'low' | 'medium' | 'high')
      : 'medium',
    enableWikiGrounding: Boolean(unsafeInput.enableWikiGrounding),
  };

  return sanitizedInput;
}

// @security - Rate limiting function
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    requestCounts.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

// @security - Clean up expired rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of requestCounts.entries()) {
    if (now > limit.resetTime) {
      requestCounts.delete(userId);
    }
  }
}, RATE_LIMIT_WINDOW);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // @security - Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // @security - Check request size (limit to 1MB)
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 1024 * 1024) {
    return res.status(413).json({ error: "Request too large" });
  }

  try {
    // @clydra-core Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // @security - Apply rate limiting
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ 
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
      });
    }

    // @security - Validate and sanitize input
    let sanitizedInput: ChatInput;
    try {
      sanitizedInput = sanitizeInput(req.body);
    } catch (sanitizeError) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: sanitizeError instanceof Error ? sanitizeError.message : "Unknown validation error"
      });
    }

    const { stream = true } = req.body; // @performance - Default to streaming for better UX

    // @clydra-core Process chat request (with streaming support)
    // @threads - Pass threadId if provided
    const result = await processChatRequest(
      userId,
      sanitizedInput,
      sanitizedInput.threadId,
      stream
    );

    // Handle streaming response
    if (stream && "stream" in result) {
      // @performance - Set up streaming headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

      try {
        // @performance - Pipe the stream directly to response
        const reader = result.stream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          res.write(value);
        }

        reader.releaseLock();
        res.end();
        return;
      } catch (streamError) {
        console.error("Streaming error:", streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: "Streaming failed" });
        }
        return;
      }
    }

    // Handle non-streaming response
    if ("message" in result) {
      return res.status(200).json(result);
    }

    // Fallback error
    return res.status(500).json({ error: "Unexpected response format" });
  } catch (error) {
    console.error("Chat proxy error:", error);

    // Handle ChatError instances with appropriate status codes
    if (error instanceof ChatError) {
      const statusMap: Record<string, number> = {
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500,
        SERVICE_UNAVAILABLE: 503,
      };

      const status = statusMap[error.code] || 500;
      return res.status(status).json({ 
        error: error.message,
        code: error.code 
      });
    }

    // Generic error handling
    return res.status(500).json({ 
      error: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { 
        details: error instanceof Error ? error.message : 'Unknown error' 
      })
    });
  }
}
