// @or Upgrade button with updated pricing
import React from "react";

interface UpgradeButtonProps {
  onClick: () => void;
  className?: string;
  variant?: "primary" | "secondary";
}

export default function UpgradeButton({ 
  onClick, 
  className = "",
  variant = "primary"
}: UpgradeButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
        isPrimary
          ? "border-primary bg-gradient-to-r from-primary to-primary/80 text-white shadow-primary-glow hover:shadow-primary-glow/50"
          : "border-border/30 bg-surface/60 hover:border-primary/30 hover:bg-surface/80"
      } ${className}`}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isPrimary ? "bg-white/20" : "bg-primary/10"}`}>
            <span className="text-xl">🚀</span>
          </div>
          
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-callout font-bold ${isPrimary ? "text-white" : "text-text-main"}`}>
                ₹ 799 / $10 – Upgrade to Pro
              </h3>
              <span className="text-yellow-400">⭐</span>
            </div>
            
            <p className={`text-caption-1 ${isPrimary ? "text-white/80" : "text-text-muted"}`}>
              Unlimited Claude & Gemini • 300 images • 5× speed
            </p>
            
            {/* Feature highlights */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <span className={`text-xs ${isPrimary ? "text-white/60" : "text-text-muted"}`}>💬</span>
                <span className={`text-xs ${isPrimary ? "text-white/80" : "text-text-muted"}`}>
                  Unlimited Chat
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs ${isPrimary ? "text-white/60" : "text-text-muted"}`}>🎨</span>
                <span className={`text-xs ${isPrimary ? "text-white/80" : "text-text-muted"}`}>
                  300 Images
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs ${isPrimary ? "text-white/60" : "text-text-muted"}`}>⚡</span>
                <span className={`text-xs ${isPrimary ? "text-white/80" : "text-text-muted"}`}>
                  Priority Speed
                </span>
              </div>
            </div>
          </div>
          
          <div className={`text-xs font-medium px-2 py-1 rounded-full ${
            isPrimary 
              ? "bg-white/20 text-white" 
              : "bg-primary/10 text-primary"
          }`}>
            Upgrade
          </div>
        </div>
      </div>
    </button>
  );
} 