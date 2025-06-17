import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface ChatSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  chatUsage?: { used: number; total: number };
  planType?: string;
}

export default function ChatSidebar({
  activeTab,
  onTabChange,
  chatUsage = { used: 420, total: 500 },
  planType = "Free",
}: ChatSidebarProps) {
  const router = useRouter();

  const tabs = [
    { id: "chat", name: "Chat", icon: "💬" },
    { id: "images", name: "Images", icon: "🎨" },
  ];

  // Removed unused variables for free tier implementation

  return (
    <div className="h-full flex flex-col bg-surface/80 backdrop-blur-xl border-r border-border/50">
      {/* Logo and Plan Badge */}
      <div className="p-6 border-b border-border/30">
        <Link href="/" className="flex items-center space-x-3 group mb-4">
          <div className="w-10 h-10 bg-gradient-neo-wave rounded-xl flex items-center justify-center shadow-primary-glow group-hover:shadow-primary-glow-lg transition-all duration-300 group-hover:scale-105">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div className="flex flex-col">
            <span className="text-large-title text-text-main group-hover:text-primary transition-colors duration-200">
              Rivo Labs
            </span>
            <span className="text-caption-1 text-text-muted -mt-1">
              Neo-Wave Tech
            </span>
          </div>
        </Link>

        {/* Plan Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
          {planType} Plan
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-primary text-white shadow-primary-glow"
                  : "text-text-muted hover:text-text-main hover:bg-surface/50"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-callout font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Free Tier Usage and Upgrade */}
      <div className="p-6 border-t border-border/30 space-y-4">
        {/* Free Tier Badge */}
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">🎁</span>
            <span className="text-callout font-medium text-text-main">
              Daily Free Tier
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-caption-1">
              <span className="text-text-muted">Images today:</span>
              <span className="text-green-600 font-medium">3 remaining</span>
            </div>
          </div>
          <div className="w-full bg-surface/60 rounded-full h-2 mt-3">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full w-0 transition-all duration-300"></div>
          </div>
          <p className="text-caption-2 text-text-muted mt-2">
            Resets daily at midnight
          </p>
        </div>

        {/* Upgrade Button */}
        <button
          onClick={() => router.push("/services")}
          className="w-full bg-gradient-neo-wave text-white px-4 py-3 rounded-xl font-medium text-callout hover:shadow-primary-glow-lg transition-all duration-300 hover:scale-[1.02]"
        >
          ₹ 799 / $10 - Upgrade to Pro
        </button>

        <div className="text-center">
          <p className="text-caption-2 text-text-muted">
            Pro: Unlimited generations • Priority processing • Advanced models
          </p>
        </div>
      </div>
    </div>
  );
}
