import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";
import {
  executeModelRequest,
  validateModelRequest,
  ModelId,
} from "../../../lib/fal-client";
import {
  checkUserCredits,
  deductUserCredits,
  addUserCredits,
} from "../../../lib/credit-utils";
import { getOrCreateUser } from "../../../lib/user-utils";

// Rate limiting (simple in-memory store for MVP)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per minute

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
    const { model, prompt, settings = {}, skipCreditCheck = false } = req.body;

    const validation = validateModelRequest({ model, prompt, settings });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    let creditCheck: any = null;
    let deductResult: any = null;

    // Skip credit check for free tier usage
    if (!skipCreditCheck) {
      // Check user balance
      creditCheck = await checkUserCredits(userId, model, settings);

      if (creditCheck.error) {
        return res.status(500).json({
          error: "Error checking balance",
          details: creditCheck.error,
        });
      }

      if (!creditCheck.hasEnoughCredits) {
        return res.status(402).json({
          error: "Insufficient funds",
          current_balance: creditCheck.currentBalance,
          amount_needed: creditCheck.creditsNeeded,
          message: `You need $${creditCheck.creditsNeeded.toFixed(2)} but only have $${creditCheck.currentBalance.toFixed(2)}. Please add funds to your account.`,
        });
      }

      // IMPORTANT: Deduct dollars BEFORE generation to prevent race conditions
      // If generation fails, we'll need to refund the amount
      deductResult = await deductUserCredits(
        userId,
        creditCheck.creditsNeeded,
        `Generated ${model}`,
        {
          model,
          prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
          request_id: `${Date.now()}`,
        }
      );

      if (!deductResult.success) {
        console.error("Error deducting balance:", deductResult.error);
        return res.status(402).json({
          error: "Balance deduction failed",
          current_balance: creditCheck.currentBalance,
          amount_needed: creditCheck.creditsNeeded,
          message:
            "Unable to deduct funds for generation. Please try again or contact support.",
          details: deductResult.error,
        });
      }
    }

    // Execute model request
    console.log('About to execute model request:', { model, prompt: prompt.substring(0, 50) + '...', settings });
    const result = await executeModelRequest({
      model: model as ModelId,
      prompt,
      settings,
    });

    console.log('Model execution result:', { success: result.success, error: result.error, hasData: !!result.data });

    if (!result.success) {
      console.error('Model execution failed:', result.error);
      
      // Generation failed - refund the amount we deducted (only if we charged)
      let refundResult = null;
      if (!skipCreditCheck && creditCheck) {
        refundResult = await addUserCredits(
          userId,
          creditCheck.creditsNeeded,
          "bonus", // Use bonus type for refunds
          `Refund for failed ${model} generation`,
          {
            model,
            prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
            original_request_id: `${Date.now()}`,
            reason: "generation_failed",
          }
        );

        if (!refundResult.success) {
          console.error(
            "Failed to refund amount after generation failure:",
            refundResult.error
          );
          // Log this for manual intervention - user should be refunded
        }
      }

      // Log failed request
      await supabaseAdmin.from("api_requests").insert({
        user_id: userId,
        model,
        prompt,
        response_data: null,
        cost: skipCreditCheck ? 0 : (creditCheck?.creditsNeeded || 0),
        latency: result.latency,
        status: "error",
        error_message: result.error || null,
      });

      return res.status(500).json({
        error: "Model execution failed",
        details: result.error || "Unknown error from AI service",
        model,
        latency: result.latency,
        amount_refunded: refundResult?.success || false,
      });
    }

    // Log the successful request
    await supabaseAdmin.from("api_requests").insert({
      user_id: userId,
      model,
      prompt,
      response_data: result.data,
      cost: skipCreditCheck ? 0 : (creditCheck?.creditsNeeded || 0),
      latency: result.latency,
      status: "success",
    });

    // Return successful response with balance information
    return res.status(200).json({
      success: true,
      data: result.data,
      requestId: `${Date.now()}-${userId.substring(0, 8)}`,
      metadata: {
        model,
        cost: skipCreditCheck ? 0 : (creditCheck?.creditsNeeded || 0),
        latency: result.latency,
        amount_used: skipCreditCheck ? 0 : (creditCheck?.creditsNeeded || 0),
        balance_remaining: skipCreditCheck ? null : deductResult?.newBalance,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
