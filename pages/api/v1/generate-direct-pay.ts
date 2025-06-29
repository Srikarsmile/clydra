import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";
import {
  executeModelRequest,
  validateModelRequest,
  ModelId,
} from "../../../lib/fal-client";
import { getOrCreateUser } from "../../../lib/user-utils";

// Rate limiting (simple in-memory store for MVP)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per minute

// Direct pricing configuration
const DIRECT_PRICING = {
  "fal-ai/imagen4/preview": 0.1, // $0.10 per image
  "fal-ai/kling-video/v2/master/text-to-video": 1.5, // $1.50 per 5s video ($0.30/second)
} as const;

function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - userLimit.count,
  };
}

function getModelPrice(modelId: string): number {
  return DIRECT_PRICING[modelId as keyof typeof DIRECT_PRICING] || 0.1;
}

// Simulate payment processing (replace with real Stripe/PayPal integration)
async function processDirectPayment(
  userId: string,
  amount: number,
  modelId: string,
  description: string
): Promise<{
  success: boolean;
  payment_id?: string;
  error?: string;
}> {
  try {
    // In production, this would be a real payment processor call
    // For now, we'll simulate successful payment for testing

    

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // For testing, always succeed
    // In production, you'd integrate with Stripe:
    /*
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: stripeCustomerId,
      description: description,
      metadata: {
        user_id: userId,
        model_id: modelId,
      },
    });
    */

    const payment_id = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log the payment in database
    await supabaseAdmin.from("payments").insert({
      user_id: userId,
      amount: amount,
      currency: "USD",
      payment_provider: "test", // In production: 'stripe', 'paypal', etc.
      payment_provider_id: payment_id,
      description: description,
      metadata: { model_id: modelId },
      status: "completed",
    });

    return {
      success: true,
      payment_id: payment_id,
    };
  } catch (error) {
    console.error("Payment processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment failed",
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get authenticated user from Clerk
    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized - Please sign in" });
    }

    // Get or create user in Supabase
    const userResult = await getOrCreateUser(clerkUserId);

    if (!userResult.success || !userResult.user) {
      return res.status(500).json({
        error: userResult.error || "Failed to get user",
      });
    }

    const userId = userResult.user.id;

    // Check rate limits
    const rateLimit = checkRateLimit(userId);
    res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS);
    res.setHeader("X-RateLimit-Remaining", rateLimit.remaining);

    if (!rateLimit.allowed) {
      return res.status(429).json({ error: "Rate limit exceeded" });
    }

    // Validate request body
    const { model, prompt, settings = {} } = req.body;

    const validation = validateModelRequest({ model, prompt, settings });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Calculate price for this generation
    const price = getModelPrice(model);
    const description = `AI ${model.includes("imagen4") ? "Image" : "Video"} Generation`;

    // Process payment BEFORE generation
    const paymentResult = await processDirectPayment(
      userId,
      price,
      model,
      description
    );

    if (!paymentResult.success) {
      return res.status(402).json({
        error: "Payment failed",
        details: paymentResult.error,
        amount_required: price,
        currency: "USD",
        message: `Payment of $${price.toFixed(2)} failed. Please check your payment method.`,
      });
    }

    // Execute model request after successful payment
    const result = await executeModelRequest({
      model: model as ModelId,
      prompt,
      settings,
    });

    if (!result.success) {
      // Generation failed after payment - this needs special handling
      // In production, you might need to refund the payment
      console.error("Generation failed after payment:", {
        payment_id: paymentResult.payment_id,
        model,
        error: result.error,
      });

      // Log failed request
      await supabaseAdmin.from("api_requests").insert({
        user_id: userId,
        model,
        prompt,
        response_data: null,
        cost: price,
        latency: result.latency,
        status: "error",
        error_message: result.error || null,
        payment_id: paymentResult.payment_id,
      });

      return res.status(500).json({
        error: "Generation failed after payment",
        details: result.error || "Unknown error from AI service",
        payment_id: paymentResult.payment_id,
        model,
        latency: result.latency,
        message:
          "Payment was processed but generation failed. Please contact support for a refund.",
      });
    }

    // Log the successful request
    await supabaseAdmin.from("api_requests").insert({
      user_id: userId,
      model,
      prompt,
      response_data: result.data,
      cost: price,
      latency: result.latency,
      status: "success",
      error_message: null,
      payment_id: paymentResult.payment_id,
    });

    // Return successful response
    return res.status(200).json({
      success: true,
      data: result.data,
      metadata: {
        model,
        cost: price,
        latency: result.latency,
        payment_id: paymentResult.payment_id,
        amount_charged: price,
        currency: "USD",
      },
    });
  } catch (error) {
    console.error("Direct payment API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
