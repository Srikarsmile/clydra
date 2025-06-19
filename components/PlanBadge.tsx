import React from "react";
import { cn } from "../lib/utils";

interface PlanBadgeProps {
  plan: "free" | "pro" | "max";
  onClick: () => void;
}

const PlanBadge: React.FC<PlanBadgeProps> = ({ plan, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
        plan === "free" &&
          "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
        plan === "pro" &&
          "bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50",
        plan === "max" &&
          "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
      )}
    >
      {plan === "free" && "Free"}
      {plan === "pro" && "Pro"}
      {plan === "max" && "Max"}
    </button>
  );
};

export default PlanBadge;
