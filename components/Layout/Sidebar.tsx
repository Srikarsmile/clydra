// @fluid-ui - T3.chat sidebar component
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useRouter } from "next/router";
import { Menu, ChevronLeft, User, LogOut, X } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { cn } from "@/lib/utils";
import ThreadList, { ThreadListRef } from "../Sidebar/ThreadList";
import ThreadSearch from "../Sidebar/ThreadSearch";
import PlanBadge from "../PlanBadge";
import { TokenGauge, TokenGaugeRef } from "../Sidebar/TokenGauge";

interface SidebarProps {
  planType?: string;
}

export interface SidebarRef {
  refreshTokenGauge: () => void;
  refreshThreadList: () => void;
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
      {user?.imageUrl && user.imageUrl.trim() !== "" ? (
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

// @dashboard-redesign - Upgrade modal component
function UpgradeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full mx-auto shadow-2xl border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Upgrade to Pro
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Unlock unlimited messages, faster responses, and access to premium
              models like GPT-4o, Claude Sonnet 4, and web search.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-2xl font-bold text-black mb-2">
                ₹799{" "}
                <span className="text-sm font-normal text-gray-500">
                  / month
                </span>
              </div>
              <div className="text-sm text-gray-600">or $15 / month</div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                Unlimited messages
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                GPT-4o, Claude Sonnet 4 & Grok 3 access
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                🌐 Web Search on all models
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                Priority support
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-all duration-300">
              Coming Soon - Upgrade to Pro
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-500 hover:text-gray-700 py-2 transition-colors"
            >
              Continue with Free Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default forwardRef<SidebarRef, SidebarProps>(function Sidebar(
  { planType = "free" },
  ref
) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();
  const tokenGaugeRef = useRef<TokenGaugeRef>(null);
  const threadListRef = useRef<ThreadListRef>(null);

  // Expose refresh method to parent components
  useImperativeHandle(
    ref,
    () => ({
      refreshTokenGauge: () => {
        tokenGaugeRef.current?.refresh();
      },
      refreshThreadList: () => {
        threadListRef.current?.refreshThreads();
      },
    }),
    []
  );

  // @dashboard-redesign - Listen for hamburger menu toggle from chat header
  useEffect(() => {
    const handleToggleMobileSidebar = () => {
      setMobileMenuOpen((prev) => !prev);
    };

    window.addEventListener("toggleMobileSidebar", handleToggleMobileSidebar);
    return () => {
      window.removeEventListener(
        "toggleMobileSidebar",
        handleToggleMobileSidebar
      );
    };
  }, []);

  // Get threadId from query params - memoized
  const threadId = useMemo(() => {
    return typeof router.query.thread === "string" ? router.query.thread : null;
  }, [router.query.thread]);

  // Create new thread - optimized with useCallback and better error handling
  const createThread = useCallback(async () => {
    try {
      console.log("🆕 Creating new thread from sidebar...");

      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const { id } = await response.json();
        console.log("✅ New thread created from sidebar:", id);

        // Use replace instead of push to avoid navigation history issues
        await router.replace(`/dashboard?thread=${id}`);

        // Refresh thread list to show the new thread
        threadListRef.current?.refreshThreads();

        // Close mobile menu after creating thread
        setMobileMenuOpen(false);

        console.log("🎯 Navigated to new thread:", id);
      } else {
        const errorText = await response.text();
        console.error(
          "❌ Failed to create thread:",
          response.status,
          response.statusText,
          errorText
        );
      }
    } catch (error) {
      console.error("❌ Failed to create thread:", error);
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

  // Handle plan badge click - show upgrade modal instead of navigating away
  const handlePlanBadgeClick = useCallback(() => {
    if (planType === "free") {
      setShowUpgradeModal(true);
    }
    setMobileMenuOpen(false);
  }, [planType]);

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
              <Menu
                size={16}
                className="hidden md:block sm:w-[18px] sm:h-[18px]"
              />
            ) : (
              <ChevronLeft
                size={16}
                className="hidden md:block sm:w-[18px] sm:h-[18px]"
              />
            )}
          </button>

          {(!collapsed || mobileMenuOpen) && (
            <div className="flex items-center">
              <span className="text-sm font-semibold tracking-tight text-gray-900">
                Clydra
              </span>
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
              collapsed && !mobileMenuOpen ? "px-2 py-2.5" : "px-3 py-2.5"
            )}
          >
            {(!collapsed || mobileMenuOpen) && "New Chat"}
          </button>
        </div>

        {/* Search + thread list */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 sm:py-3 space-y-2 sm:space-y-3">
          {(!collapsed || mobileMenuOpen) && <ThreadSearch />}
          {(!collapsed || mobileMenuOpen) && (
            <ThreadList ref={threadListRef} activeThread={threadId} />
          )}
        </div>

        {/* Bottom cluster */}
        <div className="px-2 sm:px-3 py-3 sm:py-4 border-t border-gray-200">
          {(!collapsed || mobileMenuOpen) && (
            <div className="mb-3 space-y-2 sm:space-y-3">
              <TokenGauge ref={tokenGaugeRef} />
              <PlanBadge
                plan={planType as "free" | "pro" | "max"}
                onClick={handlePlanBadgeClick}
              />
            </div>
          )}
          <ProfileChip collapsed={collapsed && !mobileMenuOpen} />
        </div>
      </aside>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
});
