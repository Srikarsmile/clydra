// @fluid-ui - T3.chat sidebar component
import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { Menu, ChevronLeft, User, LogOut } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { cn } from "@/lib/utils";
import ThreadList from "../Sidebar/ThreadList";
import ThreadSearch from "../Sidebar/ThreadSearch";
import PlanBadge from "../PlanBadge";
import { TokenGauge } from "../Sidebar/TokenGauge";

interface SidebarProps {
  planType?: string;
}

// @dashboard-redesign - ProfileChip component
function ProfileChip({ collapsed }: { collapsed: boolean }) {
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  return (
    <div className="flex items-center gap-2">
      {user?.imageUrl ? (
        <Image
          src={user.imageUrl}
          alt={user.fullName || "User"}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <User size={16} className="text-gray-600" />
        </div>
      )}
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-800 truncate block">
            {user?.fullName || user?.firstName || "User"}
          </span>
        </div>
      )}
      {!collapsed && (
        <button
          onClick={handleSignOut}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      )}
    </div>
  );
}

export default function Sidebar({ planType = "free" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  // Get threadId from query params - memoized
  const threadId = useMemo(() => {
    return typeof router.query.thread === "string" ? router.query.thread : null;
  }, [router.query.thread]);

  // Create new thread - optimized with useCallback and better error handling
  const createThread = useCallback(async () => {
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const { id } = await response.json();
        // Use replace instead of push to avoid navigation history issues
        await router.replace(`/dashboard?thread=${id}`);
      } else {
        console.error(
          "Failed to create thread:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Failed to create thread:", error);
    }
  }, [router]);

  // Toggle sidebar collapse - optimized with useCallback
  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  // Navigation to services - optimized with useCallback
  const navigateToServices = useCallback(() => {
    router.push("/services");
  }, [router]);

  return (
    <aside
      className={cn(
        "flex flex-col h-full transition-all duration-300",
        // @dashboard-redesign - Updated width from w-64 to w-60, collapsed from w-16
        collapsed ? "w-16" : "w-60",
        // @dashboard-redesign - Clean white background instead of gradient
        "bg-white",
        "border-r border-gray-200"
      )}
    >
      {/* top controls */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-gray-100">
        <button
          onClick={toggleCollapse}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-gray-900">Clydra</span>
          </div>
        )}
      </div>

      {/* @dashboard-redesign - New Chat button with black styling */}
      <div className="p-3 border-b border-gray-100">
        <button
          onClick={createThread}
          className={cn(
            "w-full rounded-lg bg-black py-2.5 text-white text-sm font-medium",
            "hover:bg-gray-800 transition-colors",
            "flex items-center justify-center gap-2",
            collapsed && "px-2"
          )}
        >
          <span className="text-lg leading-none">+</span>
          {!collapsed && "New Chat"}
        </button>
      </div>

      {/* search + thread list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {!collapsed && <ThreadSearch />}
        {!collapsed && <ThreadList activeThread={threadId} />}
      </div>

      {/* @dashboard-redesign - bottom cluster with TokenGauge and ProfileChip */}
      <div className="px-3 py-4 border-t border-gray-200">
        {!collapsed && (
          <div className="mb-3 space-y-3">
            <TokenGauge />
            <PlanBadge
              plan={planType as "free" | "pro" | "max"}
              onClick={navigateToServices}
            />
          </div>
        )}
        <ProfileChip collapsed={collapsed} />
      </div>
    </aside>
  );
}
