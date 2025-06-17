// @or Free tier usage widget
import React from "react";

interface UsageQuota {
  used: number;
  total: number;
  label: string;
  icon: React.ReactNode;
  color: string;
}

interface FreeTierWidgetProps {
  chatUsage?: { used: number; total: number };
  imageUsage?: { used: number; total: number };
}

export default function FreeTierWidget({ 
  chatUsage = { used: 12, total: 40 },
  imageUsage = { used: 2, total: 3 }
}: FreeTierWidgetProps) {
  const quotas: UsageQuota[] = [
    {
      used: chatUsage.used,
      total: chatUsage.total,
      label: "Chat",
      icon: <span>💬</span>,
      color: "text-blue-500",
    },
    {
      used: imageUsage.used,
      total: imageUsage.total, 
      label: "Images",
      icon: <span>🎨</span>,
      color: "text-purple-500",
    },
  ];

  const getProgressColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500"; 
    return "bg-green-500";
  };

  return (
    <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-4 border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-primary">📈</span>
        <h3 className="text-callout font-semibold text-text-main">Free Tier Usage</h3>
      </div>
      
      <div className="space-y-3">
        {quotas.map((quota) => {
          const percentage = Math.min((quota.used / quota.total) * 100, 100);
          
          return (
            <div key={quota.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={quota.color}>{quota.icon}</span>
                  <span className="text-caption-1 font-medium text-text-main">
                    {quota.label}
                  </span>
                </div>
                <span className="text-caption-1 text-text-muted font-mono">
                  {quota.used} / {quota.total}
                </span>
              </div>
              
              <div className="w-full bg-surface/60 rounded-full h-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getProgressColor(quota.used, quota.total)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              {quota.used >= quota.total && (
                <p className="text-xs text-red-500 font-medium">
                  Limit reached - Upgrade for unlimited access
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 