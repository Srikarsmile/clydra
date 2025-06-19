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

    // @clydra-core Process chat request
    // @threads - Pass threadId if provided
    const result = await processChatRequest(userId, input, input.threadId);

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
