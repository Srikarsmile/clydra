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

    // @performance - Set up streaming headers if requested
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Cache-Control");
      // @performance - Additional headers for optimized streaming
      res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering
      res.setHeader("Content-Encoding", "identity"); // Prevent compression buffering

      try {
        // @performance - Use streaming implementation
        const result = await processChatRequest(
          userId,
          input,
          input.threadId,
          true
        );

        if ("stream" in result) {
          // @performance - Pipe the stream directly to response
          const reader = result.stream.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              res.write(value);
            }
          } finally {
            reader.releaseLock();
          }
        }

        res.end();
        return;
      } catch (streamError) {
        console.error("Streaming error:", streamError);
        res.write(`data: ${JSON.stringify({ error: "Streaming failed" })}\n\n`);
        res.end();
        return;
      }
    }

    // @clydra-core Process chat request (non-streaming fallback)
    // @threads - Pass threadId if provided
    const result = await processChatRequest(
      userId,
      input,
      input.threadId,
      false
    );

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
