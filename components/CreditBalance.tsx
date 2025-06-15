import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

interface CreditBalance {
  balance: number;
  total_purchased: number;
  total_used: number;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonus_credits: number;
  price: number;
  is_popular: boolean;
  description: string;
  total_credits: number;
  savings_percentage: number;
}

export default function CreditBalance() {
  const { isSignedIn } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      fetchBalance();
      fetchPackages();
    }
  }, [isSignedIn]);

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/credits/balance");
      const result = await response.json();

      if (result.success) {
        setBalance(result.data);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/credits/packages");
      const result = await response.json();

      if (result.success) {
        setPackages(result.data);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);

    try {
      const response = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId,
          paymentMethod: "test",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh balance
        await fetchBalance();
        setShowPurchase(false);
        alert(`Successfully purchased ${result.data.credits_added} credits!`);
      } else {
        alert(`Purchase failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error purchasing credits:", error);
      alert("Purchase failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  if (!isSignedIn || loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Credit Balance Display */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Credit Balance
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">
              {balance?.balance || 0}
            </span>
            <span className="text-gray-500">credits</span>
          </div>
          {balance && (
            <p className="text-sm text-gray-500 mt-1">
              Used: {balance.total_used} • Purchased: {balance.total_purchased}
            </p>
          )}
        </div>

        <button
          onClick={() => setShowPurchase(!showPurchase)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Buy Credits
        </button>
      </div>

      {/* Low Balance Warning */}
      {balance && balance.balance < 5 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Low credit balance. Consider purchasing more credits to continue
            generating content.
          </p>
        </div>
      )}

      {/* Credit Packages */}
      {showPurchase && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Choose a Package</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`border rounded-lg p-3 ${
                  pkg.is_popular
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                {pkg.is_popular && (
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    ⭐ Most Popular
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900">{pkg.name}</h5>
                    <p className="text-sm text-gray-600">{pkg.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ${pkg.price}
                    </div>
                    {pkg.savings_percentage > 0 && (
                      <div className="text-xs text-green-600">
                        Save {pkg.savings_percentage}%
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                  <span>{pkg.credits} credits</span>
                  {pkg.bonus_credits > 0 && (
                    <span className="text-green-600">
                      +{pkg.bonus_credits} bonus
                    </span>
                  )}
                  <span className="font-medium">{pkg.total_credits} total</span>
                </div>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchasing === pkg.id}
                  className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    pkg.is_popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  } ${
                    purchasing === pkg.id ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {purchasing === pkg.id ? "Processing..." : "Purchase"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
