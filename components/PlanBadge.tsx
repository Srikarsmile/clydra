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
        "inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
        plan === "free" &&
          "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200",
        plan === "pro" &&
          "bg-black text-white hover:bg-gray-800 border-black",
        plan === "max" &&
          "bg-black text-white hover:bg-gray-800 border-black"
      )}
    >
      {plan === "free" && "Free Plan"}
      {plan === "pro" && "Pro Plan"}
      {plan === "max" && "Max Plan"}
    </button>
  );
};

export default PlanBadge;
