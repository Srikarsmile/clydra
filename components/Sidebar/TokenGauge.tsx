// @token-meter - Token usage gauge for sidebar
"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import useSWR from "swr";

interface TokenUsage {
  used: number;
  cap: number;
}

const fetcher = async (url: string): Promise<TokenUsage> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(
        `Token API returned ${response.status}:`,
        await response.text()
      );
      // Return default values instead of throwing to prevent UI crashes
      return { used: 0, cap: 1500000 };
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch token usage:", error);
    // Return default values if the API fails to prevent UI crashes
    return { used: 0, cap: 1500000 };
  }
};

export function TokenGauge() {
  const { data, error } = useSWR<TokenUsage>("/api/tokens/current", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const [hasShownWarning80, setHasShownWarning80] = useState(false);
  const [hasShownWarning95, setHasShownWarning95] = useState(false);

  const used = data?.used || 0;
  const cap = data?.cap || 1500000;
  const percentage = (used / cap) * 100;

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Show warning toasts
  useEffect(() => {
    if (!data) return;

    if (percentage >= 95 && !hasShownWarning95) {
      toast.error("You've hit 95% of monthly tokens", {
        description: "Consider upgrading to avoid service interruption",
      });
      setHasShownWarning95(true);
    } else if (percentage >= 80 && !hasShownWarning80) {
      toast.warning("You've hit 80% of monthly tokens", {
        description: "You're approaching your monthly limit",
      });
      setHasShownWarning80(true);
    }
  }, [percentage, hasShownWarning80, hasShownWarning95, data]);

  // Reset warning flags when usage drops (new month)
  useEffect(() => {
    if (percentage < 80) {
      setHasShownWarning80(false);
      setHasShownWarning95(false);
    } else if (percentage < 95) {
      setHasShownWarning95(false);
    }
  }, [percentage]);

  if (error) {
    return (
      <div className="p-3 rounded-lg bg-red-50 border border-red-200">
        <p className="text-sm text-red-600">
          Failed to load token usage
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-2 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            Token Usage
          </h3>
          <span className="text-xs text-gray-500">
            This month
          </span>
        </div>

        {/* Usage Numbers */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {formatNumber(used)} / {formatNumber(cap)} tokens
            </span>
            <span className="text-gray-600">
              {percentage.toFixed(1)}%
            </span>
          </div>

          {/* Progress Bar */}
          <Progress value={used} max={cap} className="h-2" />
        </div>

        {/* Status Message */}
        <div className="text-xs">
          {percentage >= 100 ? (
            <span className="text-red-600 font-medium">
              ⚠️ Monthly limit exceeded
            </span>
          ) : percentage >= 95 ? (
            <span className="text-red-600 font-medium">
              ⚠️ 95% of limit used
            </span>
          ) : percentage >= 80 ? (
            <span className="text-amber-600 font-medium">
              ⚡ 80% of limit used
            </span>
          ) : (
            <span className="text-green-600">
              ✅ {(100 - percentage).toFixed(1)}% remaining
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
