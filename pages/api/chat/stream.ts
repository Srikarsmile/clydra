// Fast streaming proxy route for OpenRouter
// Returns stream directly with minimal processing for ~400ms first token

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export default async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { model, messages, temperature = 0.5, max_tokens = 3000 } = body;

    // Start timing for performance measurement
    const t0 = performance.now();

    // Create streaming completion
    const completion = await openrouter.chat.completions.create({
      model,
      messages,
      stream: true,
      temperature,
      max_tokens,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const t1 = performance.now();

    // Convert OpenAI stream to ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return the stream with proper headers
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Server-Timing": `openrouter;dur=${(t1 - t0).toFixed()}`,
      },
    });
  } catch (error) {
    console.error("Streaming proxy error:", error);
    return NextResponse.json(
      { error: "Failed to create streaming completion" },
      { status: 500 }
    );
  }
}
