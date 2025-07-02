/**
 * @performance
 * High-performance streaming chat endpoint
 * Optimized for minimal latency with edge runtime
 */

import { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { processChatRequest, ChatInput } from "../../../server/api/chat";

export const config = {
  runtime: "nodejs", // Keep nodejs for Supabase compatibility
};

export default async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // @performance - Fast auth check
    const { userId } = getAuth(req as any);
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const input: ChatInput = await req.json();

    // @performance - Optimized streaming headers
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "identity",
    });

    // @performance - Create streaming response
    const result = await processChatRequest(
      userId,
      input,
      input.threadId,
      true
    );

    if ("stream" in result) {
      return new Response(result.stream, { headers });
    }

    // Fallback for non-streaming
    return new Response(
      `data: ${JSON.stringify(result)}\n\ndata: [DONE]\n\n`,
      { headers }
    );
  } catch (error) {
    console.error("Streaming API error:", error);
    return new Response(
      `data: ${JSON.stringify({ error: "Streaming failed" })}\n\n`,
      { 
        status: 500,
        headers: {
          "Content-Type": "text/event-stream",
        }
      }
    );
  }
}
