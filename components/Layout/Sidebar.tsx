// @fluid-ui - T3.chat sidebar component
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import { Menu, ChevronLeft, User, LogOut, X } from "lucide-react";
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

// @dashboard-redesign - Mobile-optimized ProfileChip component
function ProfileChip({ collapsed }: { collapsed: boolean }) {
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {user?.imageUrl ? (
        <Image
          src={user.imageUrl}
          alt={user.fullName || "User"}
          width={32}
          height={32}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
        />
      ) : (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <User size={14} className="text-gray-600 sm:w-4 sm:h-4" />
        </div>
      )}
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-sm font-medium text-gray-800 truncate block">
            {user?.fullName || user?.firstName || "User"}
          </span>
        </div>
      )}
      {!collapsed && (
        <button
          onClick={handleSignOut}
          className="p-1.5 sm:p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors touch-manipulation min-w-[32px] min-h-[32px] sm:min-w-auto sm:min-h-auto flex items-center justify-center"
          title="Sign out"
        >
          <LogOut size={14} className="sm:w-4 sm:h-4" />
        </button>
      )}
    </div>
  );
}

export default function Sidebar({ planType = "free" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  // @dashboard-redesign - Listen for hamburger menu toggle from chat header
  useEffect(() => {
    const handleToggleMobileSidebar = () => {
      setMobileMenuOpen(prev => !prev);
    };

    window.addEventListener('toggleMobileSidebar', handleToggleMobileSidebar);
    return () => {
      window.removeEventListener('toggleMobileSidebar', handleToggleMobileSidebar);
    };
  }, []);

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
        // Close mobile menu after creating thread
        setMobileMenuOpen(false);
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

  // Toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  // Navigation to services - optimized with useCallback
  const navigateToServices = useCallback(() => {
    router.push("/services");
    setMobileMenuOpen(false);
  }, [router]);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col h-full transition-all duration-300 bg-white border-r border-gray-200",
          // Mobile: Transform-based sliding from left
          "md:relative md:translate-x-0",
          mobileMenuOpen
            ? "fixed inset-y-0 left-0 z-50 w-80 translate-x-0"
            : "fixed inset-y-0 left-0 z-50 w-80 -translate-x-full",
          // Desktop: Standard responsive width
          "md:relative md:z-auto",
          collapsed ? "md:w-12 lg:w-16" : "md:w-56 lg:w-60"
        )}
      >
        {/* Mobile/Desktop header */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-3 sm:py-4 border-b border-gray-100">
          {/* Mobile close button */}
          <button
            onClick={mobileMenuOpen ? toggleMobileMenu : toggleCollapse}
            className="p-1.5 sm:p-1 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-auto sm:min-h-auto flex items-center justify-center"
          >
            {mobileMenuOpen ? (
              <X size={16} className="md:hidden" />
            ) : collapsed ? (
              <Menu size={16} className="hidden md:block sm:w-[18px] sm:h-[18px]" />
            ) : (
              <ChevronLeft size={16} className="hidden md:block sm:w-[18px] sm:h-[18px]" />
            )}
            {/* Always show close button on mobile when menu is open */}
            {mobileMenuOpen && <X size={16} className="md:hidden" />}
          </button>

          {(!collapsed || mobileMenuOpen) && (
            <div className="flex items-center">
              <span className="text-sm font-semibold tracking-tight text-gray-900">Clydra</span>
            </div>
          )}
        </div>

        {/* New Chat button */}
        <div className="p-2 sm:p-3 border-b border-gray-100">
          <button
            onClick={createThread}
            className={cn(
              "w-full rounded-lg bg-black text-white text-sm font-medium",
              "hover:bg-gray-800 transition-colors touch-manipulation",
              "flex items-center justify-center gap-2",
              "min-h-[40px] sm:min-h-auto",
              (collapsed && !mobileMenuOpen) ? "px-2 py-2.5" : "px-3 py-2.5"
            )}
          >
            <span className="text-lg leading-none">+</span>
            {(!collapsed || mobileMenuOpen) && "New Chat"}
          </button>
        </div>

        {/* Search + thread list */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 sm:py-3 space-y-2 sm:space-y-3">
          {(!collapsed || mobileMenuOpen) && <ThreadSearch />}
          {(!collapsed || mobileMenuOpen) && <ThreadList activeThread={threadId} />}
        </div>

        {/* Bottom cluster */}
        <div className="px-2 sm:px-3 py-3 sm:py-4 border-t border-gray-200">
          {(!collapsed || mobileMenuOpen) && (
            <div className="mb-3 space-y-2 sm:space-y-3">
              <TokenGauge />
              <PlanBadge
                plan={planType as "free" | "pro" | "max"}
                onClick={navigateToServices}
              />
            </div>
          )}
          <ProfileChip collapsed={collapsed && !mobileMenuOpen} />
        </div>
      </aside>
    </>
  );
}
