/**
 * @clydra-core
 * Convo Core - Upgrade Call-to-Action Component
 *
 * Shows upgrade prompt with Clydra branding and pricing
 */

import { Button } from "./ui/button";
import { Zap, ArrowRight } from "lucide-react";

interface UpgradeCTAProps {
  className?: string;
  compact?: boolean;
}

export default function UpgradeCTA({
  className = "",
  compact = false,
}: UpgradeCTAProps) {
  const handleUpgradeClick = () => {
    // Redirect to services page for upgrade information
    window.open("/services", "_blank");
  };

  if (compact) {
    return (
      <Button
        onClick={handleUpgradeClick}
        className={`bg-[#0BA5EC] hover:bg-[#0BA5EC]/90 text-white border-[#0BA5EC] ${className}`}
        size="sm"
      >
        <Zap className="w-4 h-4 mr-2" />
        Upgrade to Pro
      </Button>
    );
  }

  return (
    <div
      className={`bg-gradient-to-r from-[#0BA5EC]/10 to-[#0BA5EC]/5 border border-[#0BA5EC]/20 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-[#0BA5EC]/20 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#0BA5EC]" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Upgrade to Pro
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Unlock unlimited messages, faster responses, and access to premium
            models like GPT-4 and Claude.
          </p>

          <div className="mt-4 flex items-center space-x-4">
            <div className="text-2xl font-bold text-[#0BA5EC]">
              ₹799{" "}
              <span className="text-sm font-normal text-gray-500">/ month</span>
            </div>
            <div className="text-lg text-gray-500">
              or $10 <span className="text-sm">/ month</span>
            </div>
          </div>

          <Button
            onClick={handleUpgradeClick}
            className="mt-4 bg-[#0BA5EC] hover:bg-[#0BA5EC]/90 text-white border-[#0BA5EC] shadow-lg shadow-[#0BA5EC]/25"
          >
            Upgrade Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Features list */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-[#0BA5EC] rounded-full mr-3"></div>
          Unlimited messages
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-[#0BA5EC] rounded-full mr-3"></div>
          GPT-4 & Claude access
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-[#0BA5EC] rounded-full mr-3"></div>
          Priority support
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-[#0BA5EC] rounded-full mr-3"></div>
          Advanced features
        </div>
      </div>
    </div>
  );
}
