import { supabaseAdmin } from "./supabase";
import { calculateDollarsNeeded, CREDIT_CONFIG } from "./credit-system";

export interface CreditBalance {
  balance: number; // in USD
  total_purchased: number; // in USD
  total_used: number; // in USD
}

export interface CreditTransaction {
  id: string;
  type: "purchase" | "usage" | "refund" | "bonus" | "signup_bonus";
  amount: number; // in USD
  balance_before: number; // in USD
  balance_after: number; // in USD
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Get user's dollar balance
 */
export async function getUserCreditBalance(userId: string): Promise<{
  data: CreditBalance | null;
  error: unknown;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_credit_balances")
      .select("balance, total_purchased, total_used")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // No balance record exists, initialize with signup bonus
      await initializeUserCredits(userId);
      return {
        data: {
          balance: CREDIT_CONFIG.FREE_DOLLARS_ON_SIGNUP,
          total_purchased: 0,
          total_used: 0,
        },
        error: null,
      };
    }

    // Convert from cents to dollars if stored as cents
    if (data) {
      return {
        data: {
          balance: data.balance / 100, // Convert cents to dollars
          total_purchased: data.total_purchased / 100,
          total_used: data.total_used / 100,
        },
        error: null,
      };
    }

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Initialize user balance (typically called on signup)
 */
export async function initializeUserCredits(
  userId: string,
  initialDollars: number = CREDIT_CONFIG.FREE_DOLLARS_ON_SIGNUP
): Promise<{
  success: boolean;
  error?: unknown;
}> {
  try {
    // Store as cents to avoid floating point issues
    const initialCents = Math.round(initialDollars * 100);
    
    const { error } = await supabaseAdmin.rpc("initialize_user_credits", {
      user_uuid: userId,
      initial_credits: initialCents,
    });

    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Add dollars to user's balance
 */
export async function addUserCredits(
  userId: string,
  dollarsToAdd: number,
  transactionType: "purchase" | "bonus" = "purchase",
  description: string = "Dollars added",
  metadata: Record<string, unknown> = {}
): Promise<{
  success: boolean;
  newBalance?: number;
  error?: unknown;
}> {
  try {
    // Convert to cents to avoid floating point issues
    const centsToAdd = Math.round(dollarsToAdd * 100);
    
    const { data: newBalanceCents, error } = await supabaseAdmin.rpc(
      "add_user_credits",
      {
        user_uuid: userId,
        credits_to_add: centsToAdd,
        transaction_type: transactionType,
        transaction_description: description,
        transaction_metadata: metadata,
      }
    );

    const newBalance = newBalanceCents ? newBalanceCents / 100 : undefined;

    return { success: !error, newBalance, error };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Deduct dollars from user's balance
 */
export async function deductUserCredits(
  userId: string,
  dollarsToDeduct: number,
  description: string = "Dollars used",
  metadata: Record<string, unknown> = {}
): Promise<{
  success: boolean;
  newBalance?: number;
  error?: unknown;
}> {
  try {
    // Convert to cents to avoid floating point issues
    const centsToDeduct = Math.round(dollarsToDeduct * 100);
    
    const { data: newBalanceCents, error } = await supabaseAdmin.rpc(
      "deduct_user_credits",
      {
        user_uuid: userId,
        credits_to_deduct: centsToDeduct,
        transaction_description: description,
        transaction_metadata: metadata,
      }
    );

    const newBalance = newBalanceCents ? newBalanceCents / 100 : undefined;

    return { success: !error, newBalance, error };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Check if user has enough balance for a model
 */
export async function checkUserCredits(
  userId: string,
  modelId: string,
  settings?: { duration?: number }
): Promise<{
  hasEnoughCredits: boolean;
  currentBalance: number;
  creditsNeeded: number;
  error?: unknown;
}> {
  try {
    const dollarsNeeded = calculateDollarsNeeded(modelId, settings);
    const { data: balance, error } = await getUserCreditBalance(userId);

    if (error) {
      return {
        hasEnoughCredits: false,
        currentBalance: 0,
        creditsNeeded: dollarsNeeded,
        error,
      };
    }

    const currentBalance = balance?.balance || 0;
    const hasEnoughCredits = currentBalance >= dollarsNeeded;

    return {
      hasEnoughCredits,
      currentBalance,
      creditsNeeded: dollarsNeeded,
    };
  } catch (error) {
    return {
      hasEnoughCredits: false,
      currentBalance: 0,
      creditsNeeded: calculateDollarsNeeded(modelId, settings),
      error,
    };
  }
}

/**
 * Get user's transaction history
 */
export async function getUserCreditTransactions(
  userId: string,
  limit: number = 50
): Promise<{
  data: CreditTransaction[] | null;
  error: unknown;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Convert amounts from cents to dollars
    const convertedData = data ? data.map(transaction => ({
      ...transaction,
      amount: transaction.amount / 100,
      balance_before: transaction.balance_before / 100,
      balance_after: transaction.balance_after / 100,
    })) : null;

    return { data: convertedData, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get available credit packages
 */
export async function getCreditPackages(): Promise<{
  data: unknown[] | null;
  error: unknown;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from("credit_packages")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Process a dollar purchase
 */
export async function processCreditPurchase(
  userId: string,
  packageId: string,
  paymentData: {
    amount_paid: number;
    payment_method?: string;
    payment_provider?: string;
    payment_provider_id?: string;
  }
): Promise<{
  success: boolean;
  purchase_id?: string;
  error?: unknown;
}> {
  try {
    // Get package details
    const { data: packageData, error: packageError } = await supabaseAdmin
      .from("credit_packages")
      .select("*")
      .eq("id", packageId)
      .single();

    if (packageError || !packageData) {
      return { success: false, error: "Package not found" };
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("user_purchases")
      .insert({
        user_id: userId,
        package_id: packageId,
        credits_purchased: Math.round(packageData.amount * 100), // Store as cents
        bonus_credits: Math.round((packageData.bonus_amount || 0) * 100), // Store as cents
        amount_paid: paymentData.amount_paid,
        payment_method: paymentData.payment_method,
        payment_provider: paymentData.payment_provider,
        payment_provider_id: paymentData.payment_provider_id,
        status: "completed",
      })
      .select()
      .single();

    if (purchaseError) {
      return { success: false, error: purchaseError };
    }

    // Add dollars to user's balance
    const totalDollars = packageData.amount + (packageData.bonus_amount || 0);
    const { success: creditSuccess, error: creditError } = await addUserCredits(
      userId,
      totalDollars,
      "purchase",
      `Purchased ${packageData.name}`,
      {
        package_id: packageId,
        purchase_id: purchase.id,
        base_amount: packageData.amount,
        bonus_amount: packageData.bonus_amount || 0,
      }
    );

    if (!creditSuccess) {
      // Rollback purchase on credit failure
      await supabaseAdmin
        .from("user_purchases")
        .update({ status: "failed" })
        .eq("id", purchase.id);

      return { success: false, error: creditError };
    }

    return { success: true, purchase_id: purchase.id };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Estimate generation cost
 */
export function estimateGenerationCost(modelId: string): {
  dollars: number;
  dollarValue: number;
} {
  const dollars = calculateDollarsNeeded(modelId);
  return {
    dollars,
    dollarValue: dollars,
  };
}
