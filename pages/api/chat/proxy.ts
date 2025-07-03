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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // @clydra-core Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const input: ChatInput = req.body;
    const { stream = true } = req.body; // @performance - Default to streaming for better UX

    // @clydra-core Process chat request (with streaming support)
    // @threads - Pass threadId if provided
    const result = await processChatRequest(
      userId,
      input,
      input.threadId,
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

    // Handle regular response
    if (result && typeof result === 'object' && 'timing' in result && result.timing) {
      res.setHeader("Server-Timing", `openrouter;dur=${result.timing.openRouterDuration.toFixed()}`);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error("Chat API error:", error);

    if (error instanceof ChatError) {
      const statusCode =
        error.code === "TOO_MANY_REQUESTS"
          ? 429
          : error.code === "SERVICE_UNAVAILABLE"
            ? 503
            : error.code === "UNAUTHORIZED"
              ? 401
              : 500;

      return res.status(statusCode).json({ error: error.message });
    }

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to process chat request",
    });
  }
}
