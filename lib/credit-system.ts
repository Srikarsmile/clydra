// Dollar-Based Payment System Configuration
// Handles user balance, pricing, and billing in USD

export interface CreditPackage {
  id: string;
  name: string;
  amount: number; // in USD
  price: number; // in USD (same as amount for direct dollar purchases)
  bonus_amount?: number; // bonus dollars
  popular?: boolean;
  description: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: "purchase" | "usage" | "refund" | "bonus";
  amount: number; // in USD - positive for additions, negative for usage
  balance_after: number; // in USD
  description: string;
  created_at: string;
}

export interface UserCreditBalance {
  user_id: string;
  balance: number; // in USD
  total_purchased: number; // in USD
  total_used: number; // in USD
  last_updated: string;
}

// Dollar-based pricing configuration
export const CREDIT_CONFIG = {
  // Base cost per image from FAL API
  BASE_COST_PER_IMAGE: 0.04,

  // Our markup (2.5x base cost)
  COST_PER_IMAGE: 0.1, // $0.10 per image

  // Minimum balance required for generation
  MIN_BALANCE_FOR_GENERATION: 0.01, // $0.01

  // Free dollars for new users
  FREE_DOLLARS_ON_SIGNUP: 3.0, // $3.00
} as const;

// Dollar packages with volume discounts
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    amount: 5.0,
    price: 5.0,
    description: "Perfect for trying out our AI services",
  },
  {
    id: "basic",
    name: "Basic Pack",
    amount: 20.0,
    price: 18.0, // 10% discount
    bonus_amount: 2.0,
    description: "Great for regular users",
  },
  {
    id: "pro",
    name: "Pro Pack",
    amount: 50.0,
    price: 40.0, // 20% discount
    bonus_amount: 10.0,
    popular: true,
    description: "Best value for power users",
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    amount: 200.0,
    price: 150.0, // 25% discount
    bonus_amount: 50.0,
    description: "For businesses and heavy users",
  },
];

// Model-specific dollar costs
export const MODEL_DOLLAR_COSTS = {
  "fal-ai/imagen4/preview": 0.1, // $0.10 per image
} as const;

/**
 * Calculate dollars needed for a model
 */
export function calculateDollarsNeeded(
  modelId: string,
  settings?: { duration?: number }
): number {
  const baseCost =
    MODEL_DOLLAR_COSTS[modelId as keyof typeof MODEL_DOLLAR_COSTS] || 0.1;

  return baseCost;
}

/**
 * Calculate total value for a dollar package including bonuses
 */
export function calculatePackageValue(packageId: string): {
  totalDollars: number;
  effectiveCostPerDollar: number;
  savings: number;
} {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) throw new Error("Package not found");

  const totalDollars = pkg.amount + (pkg.bonus_amount || 0);
  const effectiveCostPerDollar = pkg.price / totalDollars;
  const savings = (1.0 - effectiveCostPerDollar) * totalDollars;

  return {
    totalDollars,
    effectiveCostPerDollar,
    savings,
  };
}

/**
 * Check if user has enough balance
 */
export function hasEnoughBalance(
  userBalance: number,
  modelId: string,
  settings?: { duration?: number }
): boolean {
  const dollarsNeeded = calculateDollarsNeeded(modelId, settings);
  return userBalance >= dollarsNeeded;
}

/**
 * Calculate refund amount for unused balance
 */
export function calculateRefund(dollars: number, packageId: string): number {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return 0;

  const { effectiveCostPerDollar } = calculatePackageValue(packageId);
  return dollars * effectiveCostPerDollar * 0.8; // 80% refund rate
}

/**
 * Get recommended package based on usage patterns
 */
export function getRecommendedPackage(
  estimatedMonthlySpend: number
): CreditPackage {
  if (estimatedMonthlySpend <= 5) return CREDIT_PACKAGES[0]; // Starter
  if (estimatedMonthlySpend <= 20) return CREDIT_PACKAGES[1]; // Basic
  if (estimatedMonthlySpend <= 50) return CREDIT_PACKAGES[2]; // Pro
  return CREDIT_PACKAGES[3]; // Enterprise
}

/**
 * Format dollars for display
 */
export function formatDollars(dollars: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}
