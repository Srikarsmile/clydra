// @token-meter - Token usage gauge for sidebar
"use client";

import {
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
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
      return { used: 0, cap: 40000 }; // Use daily cap
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch token usage:", error);
    // Return default values if the API fails to prevent UI crashes
    return { used: 0, cap: 40000 }; // Use daily cap
  }
};

export interface TokenGaugeRef {
  refresh: () => void;
}

export const TokenGauge = forwardRef<TokenGaugeRef, {}>(
  function TokenGauge(props, ref) {
    // Use SWR with manual control - no automatic polling
    const { data: tokenUsage, mutate, isLoading, error } = useSWR<TokenUsage>(
      "/api/tokens/current",
      fetcher,
      {
        refreshInterval: 0, // Disable automatic polling completely
        revalidateOnFocus: false, // Don't refresh on window focus
        revalidateOnReconnect: false, // Don't refresh on network reconnect
        dedupingInterval: 5000, // Prevent rapid successive calls
      }
    );

    // Expose refresh method to parent components
    useImperativeHandle(
      ref,
      () => ({
        refresh: () => {
          console.log("🔄 Token gauge: Manual refresh triggered");
          mutate(); // Manually trigger SWR revalidation
        },
      }),
      [mutate]
    );

    const used = tokenUsage?.used ?? 0;
    const cap = tokenUsage?.cap ?? 80000; // Daily cap
    const remaining = cap - used;
    const percentage = cap > 0 ? (used / cap) * 100 : 0;

    // Show warning when tokens are running low
    useEffect(() => {
      if (remaining <= 1000 && remaining > 0) {
        toast.warning(
          `Token warning: Only ${remaining.toLocaleString()} tokens remaining today!`
        );
      } else if (remaining <= 0) {
        toast.error(
          "Daily token limit reached! Token counter will reset tomorrow."
        );
      }
    }, [remaining]);

    // Get progress bar color based on usage
    const getProgressColor = () => {
      if (percentage >= 90) return "bg-red-500";
      if (percentage >= 75) return "bg-orange-500";
      if (percentage >= 50) return "bg-yellow-500";
      return "bg-green-500";
    };

    return (
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Daily Tokens</span>
          <span className="text-xs text-muted-foreground">
            {used.toLocaleString()} / {cap.toLocaleString()}
          </span>
        </div>

        <div className="relative">
          <Progress value={percentage} className="h-2 mb-1" />
          <div
            className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Remaining: {remaining.toLocaleString()}</span>
          <span>{percentage.toFixed(1)}% used</span>
        </div>

        {remaining <= 0 && (
          <div className="text-xs text-red-500 mt-2 font-medium">
            ⚠️ Daily limit reached. Resets tomorrow.
          </div>
        )}
      </div>
    );
  }
);

export default TokenGauge;
