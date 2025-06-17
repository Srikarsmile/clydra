import { NextApiRequest, NextApiResponse } from "next";
import { getCreditPackages } from "../../../lib/credit-utils";
import {
  CREDIT_PACKAGES,
  calculatePackageValue,
} from "../../../lib/credit-system";

interface DatabasePackage {
  id: string;
  name: string;
  amount: number; // in USD
  bonus_amount: number; // in USD
  price: number;
  is_active: boolean;
  is_popular: boolean;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get packages from database
    const { data: packages, error } = await getCreditPackages();

    if (error) {
      // Fallback to static packages if database error
      const enrichedPackages = CREDIT_PACKAGES.map((pkg) => {
        const value = calculatePackageValue(pkg.id);
        return {
          ...pkg,
          total_amount: value.totalDollars,
          effective_cost_per_dollar: value.effectiveCostPerDollar,
          savings: value.savings,
          savings_percentage: Math.round((value.savings / pkg.amount) * 100),
        };
      });

      return res.status(200).json({
        success: true,
        data: enrichedPackages,
        source: "static",
      });
    }

    // Enrich packages with calculated values
    const enrichedPackages = ((packages as DatabasePackage[]) || []).map(
      (pkg: DatabasePackage) => {
        const totalAmount = pkg.amount + (pkg.bonus_amount || 0);
        const effectiveCostPerDollar = pkg.price / totalAmount;
        const savings = totalAmount - pkg.price;
        const savingsPercentage = Math.round((savings / totalAmount) * 100);

        return {
          ...pkg,
          total_amount: totalAmount,
          effective_cost_per_dollar: effectiveCostPerDollar,
          savings: Math.max(0, savings),
          savings_percentage: Math.max(0, savingsPercentage),
        };
      }
    );

    return res.status(200).json({
      success: true,
      data: enrichedPackages,
      source: "database",
    });
  } catch (error) {
    console.error("Credit packages API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
