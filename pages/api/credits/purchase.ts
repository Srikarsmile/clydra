import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { processCreditPurchase } from "../../../lib/credit-utils";

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

    // Get user from Supabase
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate request body
    const {
      packageId,
      paymentMethod = "test",
      paymentProvider = "test",
    } = req.body;

    if (!packageId) {
      return res.status(400).json({ error: "Package ID is required" });
    }

    // Get package details to verify price
    const { data: packageData } = await supabaseAdmin
      .from("credit_packages")
      .select("*")
      .eq("id", packageId)
      .eq("is_active", true)
      .single();

    if (!packageData) {
      return res.status(404).json({ error: "Package not found or inactive" });
    }

    // For testing purposes, simulate successful payment
    // In production, integrate with Stripe, PayPal, etc.
    const paymentData = {
      amount_paid: packageData.price,
      payment_method: paymentMethod,
      payment_provider: paymentProvider,
      payment_provider_id: `test_${Date.now()}`, // Would be actual payment ID from provider
    };

    // Process the credit purchase
    const result = await processCreditPurchase(user.id, packageId, paymentData);

    if (!result.success) {
      return res.status(400).json({
        error: "Purchase failed",
        details: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        purchase_id: result.purchase_id,
        package: packageData,
        credits_added: packageData.credits + (packageData.bonus_credits || 0),
        amount_paid: paymentData.amount_paid,
      },
      message: "Credits purchased successfully!",
    });
  } catch (error) {
    console.error("Credit purchase API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
