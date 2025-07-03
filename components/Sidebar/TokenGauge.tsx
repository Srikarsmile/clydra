// @token-meter - Token usage gauge for sidebar
"use client";

import { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
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

export interface TokenGaugeRef {
  refresh: () => void;
}

export const TokenGauge = forwardRef<TokenGaugeRef, {}>((props, ref) => {
  const { data, error, mutate } = useSWR<TokenUsage>("/api/tokens/current", fetcher, {
    refreshInterval: 0, // Disable automatic polling - we'll refresh manually after chat responses
    revalidateOnFocus: false, // Don't refresh when tab gains focus
    revalidateOnReconnect: false, // Don't refresh on network reconnect
  });

  const [hasShownWarning80, setHasShownWarning80] = useState(false);
  const [hasShownWarning95, setHasShownWarning95] = useState(false);

  // Expose refresh function to parent components
  const refresh = useCallback(() => {
    mutate(); // Trigger a fresh fetch
  }, [mutate]);

  useImperativeHandle(ref, () => ({
    refresh,
  }), [refresh]);

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
              ⚠️ Daily limit exceeded
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

        {/* Development Reset Button */}
        {percentage >= 100 && (
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/tokens/reset', { method: 'POST' });
                if (response.ok) {
                  toast.success('Tokens reset to 40,000!');
                  refresh(); // Use our refresh function instead of page reload
                } else {
                  toast.error('Failed to reset tokens');
                }
              } catch (error) {
                toast.error('Failed to reset tokens');
              }
            }}
            className="w-full mt-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors"
          >
            🔄 Reset Daily Tokens
          </button>
        )}
      </div>
    </div>
  );
});

TokenGauge.displayName = "TokenGauge";
