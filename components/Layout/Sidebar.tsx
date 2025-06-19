// @fluid-ui - T3.chat sidebar component
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, MessageCircle, Image, ChevronRight } from "lucide-react"; // @brandbar @ui-polish
// useClerk and Power removed - sign out moved to top bar @signout
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  chatUsage?: { used: number; total: number };
  planType?: string;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  planType = "Free",
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  // signOut moved to global top bar @signout

  const tabs = [
    { id: "chat", name: "Chat", icon: MessageCircle },
    { id: "images", name: "Images", icon: Image },
  ];

  return (
    <aside
      className={cn(
        // @ux-refresh - Updated gradient and styling
        "flex flex-col rounded-tr-3xl border-r bg-gradient-to-b",
        "from-brand-50/50 to-bglight",
        "dark:from-[#1B1B23] dark:to-[#141418]",
        collapsed ? "w-16" : "w-60"
        // @ux-refresh - End updated styling
      )}
    >
      {/* @ui-polish - Header block with user info and collapse toggle */}
      <div className="flex items-center justify-between px-3 py-4">
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-brand-50">
          {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand to-brand/70 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Clydra</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                AI Chat
              </p>
            </div>
          </div>
        )}
      </div>

      {/* @ui-polish - Plan badge */}
      {!collapsed && (
        <span className="mx-3 mb-2 inline-block rounded-full bg-brand-50 px-2 py-[2px] text-[10px] text-brand-600">
          Free Plan
        </span>
      )}

      {/* @fluid-ui - Header with hamburger toggle */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors"
          >
            <Menu size={18} className="text-gray-600" />
          </button>
          
          {!collapsed && (
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-brand to-brand/70 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">
                  Rivo Labs
                </span>
                <span className="text-xs text-gray-500 -mt-1">
                  AI Chat
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* @fluid-ui - Plan Badge */}
        {!collapsed && (
          <div className="mt-4 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand border border-brand/20">
            <span className="w-1.5 h-1.5 bg-brand rounded-full mr-2"></span>
            {planType} Plan
          </div>
        )}
      </div>

      {/* @fluid-ui - Navigation */}
      <div className="flex-1 p-3">
        <nav className="space-y-1">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center rounded-lg text-left transition-all duration-200",
                  collapsed ? "p-3 justify-center" : "px-3 py-2 space-x-3",
                  activeTab === item.id
                    ? "bg-brand text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-black/5"
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon size={18} />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>
        
        {/* @ux-refresh - Updated navigation spacing and text colors */}
        <ul className="mt-4 space-y-1 text-sm text-txt-muted">
          {/* Additional navigation items can go here */}
        </ul>
        {/* @ux-refresh - End updated navigation */}
      </div>

      {/* @fluid-ui - Bottom section with usage and upgrade */}
      {!collapsed && (
        <div className="p-4 border-t border-border/30 space-y-3">
          {/* Free Tier Usage */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm">🎁</span>
              <span className="text-sm font-medium text-gray-900">
                Daily Free Tier
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Messages today:</span>
                <span className="text-green-600 font-medium">5 remaining</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="bg-gradient-to-r from-green-400 to-blue-400 h-1.5 rounded-full w-1/3 transition-all duration-300"></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Resets daily at midnight
            </p>
          </div>

          {/* @ui-polish - New Chat button style */}
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-lg bg-brand-500 py-2 text-sm font-medium text-white
                       hover:bg-brand-600 transition"
          >
            + New Chat
          </button>

          {/* @fluid-ui - Upgrade Button */}
          <button
            onClick={() => router.push("/services")}
            className="w-full bg-gradient-to-r from-brand to-brand/80 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            ₹799 / $10 - Upgrade to Pro
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Pro: Unlimited • Priority • Advanced models
            </p>
          </div>
        </div>
      )}
    </aside>
  );
} 