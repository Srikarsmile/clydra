/**
 * @clydra-core
 * Convo Core - Free Tier Usage Widget
 *
 * Displays daily chat usage progress and remaining messages
 */

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MODEL_ALIASES } from "../../types/chatModels";

interface UsageData {
  used: number;
  limit: number;
  remaining: number;
}

export default function FreeTierWidget() {
  const { user } = useUser();
  const [usage, setUsage] = useState<UsageData>({
    used: 0,
    limit: 40,
    remaining: 40,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUsage = async () => {
      try {
        const response = await fetch("/api/chat/usage");
        if (response.ok) {
          const data = await response.json();
          setUsage({
            used: data.dailyCount || 0,
            limit: data.limit || 40,
            remaining: data.remaining || 40,
          });
        }
      } catch (error) {
        console.error("Failed to fetch usage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const usagePercentage = Math.min((usage.used / usage.limit) * 100, 100);
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usage.remaining <= 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Today&apos;s Chat Usage
        </h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isAtLimit
              ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
              : isNearLimit
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
          }`}
        >
          Free Plan
        </span>
      </div>

      {/* Usage Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Messages: {usage.used} / {usage.limit}
        </span>
        <span
          className={`font-medium ${
            isAtLimit
              ? "text-red-600 dark:text-red-400"
              : isNearLimit
                ? "text-amber-600 dark:text-amber-400"
                : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {usage.remaining} remaining
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isAtLimit
              ? "bg-red-500"
              : isNearLimit
                ? "bg-amber-500"
                : "bg-[#0BA5EC]"
          }`}
          style={{ width: `${usagePercentage}%` }}
        />
      </div>

      {/* Status Message */}
      {isAtLimit && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-md p-2">
          Daily limit reached. Upgrade to Pro for unlimited messages.
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 rounded-md p-2">
          You&apos;re running low on messages. Consider upgrading to Pro.
        </div>
      )}

      {/* Free Tier Models Info */}
      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <p>
          Free plan models: {MODEL_ALIASES["openai/gpt-4o"]},{" "}
          {MODEL_ALIASES["google/gemini-2.5-flash-preview"]}
        </p>
        <p>
          Pro unlocks: {MODEL_ALIASES["google/gemini-2.5-pro"]},{" "}
          {MODEL_ALIASES["anthropic/claude-sonnet-4"]},{" "}
          {MODEL_ALIASES["google/gemini-1.5-pro"]},{" "}
          {MODEL_ALIASES["deepseek/deepseek-r1"]}
        </p>
        <p>
          Max unlocks: {MODEL_ALIASES["anthropic/claude-opus-4"]},{" "}
          {MODEL_ALIASES["meta-llama/llama-3-70b-instruct"]}
        </p>
      </div>
    </div>
  );
}
