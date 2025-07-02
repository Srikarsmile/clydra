/**
 * @performance 
 * High-Performance Streaming Chat API
 * 
 * Optimized for minimal latency with:
 * - Server-Sent Events streaming
 * - Parallel database operations
 * - Early response initialization
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { processChatRequest, ChatInput } from "../../../server/api/chat";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { messages, model, threadId }: ChatInput = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    // @performance - Set up streaming headers immediately
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

    try {
      // @performance - Use streaming implementation
      const result = await processChatRequest(
        userId,
        { messages, model, threadId },
        threadId,
        true // Enable streaming
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
    } catch (error: any) {
      console.error("Streaming chat error:", error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error("Chat stream API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
} 