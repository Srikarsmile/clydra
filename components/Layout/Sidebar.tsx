// @fluid-ui - T3.chat sidebar component
import React, { useState } from "react";
import { useRouter } from "next/router";
import { Menu, ChevronLeft, User, LogOut } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { cn } from "@/lib/utils";
import ThreadList from "../Sidebar/ThreadList";
import ThreadSearch from "../Sidebar/ThreadSearch";
import PlanBadge from "../PlanBadge";

interface SidebarProps {
  planType?: string;
}

export default function Sidebar({
  planType = "free",
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  // Get threadId from query params
  const threadId = typeof router.query.thread === "string" ? router.query.thread : null;

  // Create new thread
  const createThread = async () => {
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const { id } = await response.json();
        router.push(`/dashboard?thread=${id}`);
      }
    } catch (error) {
      console.error("Failed to create thread:", error);
    }
  };

  // UserChip component
  const UserChip = () => (
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
        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
          <User size={16} className="text-brand-600" />
        </div>
      )}
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-700 truncate block">
            {user?.fullName || user?.firstName || "User"}
          </span>
        </div>
      )}
      {!collapsed && (
        <button
          onClick={() => signOut()}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      )}
    </div>
  );

  return (
    <aside
      className={cn(
        "h-full flex flex-col transition-all duration-300 bg-gradient-to-b",
        "from-brand-50/50 to-bglight dark:from-[#1B1B23] dark:to-[#141418]",
        "border-r border-gray-200 dark:border-[#2A2A2E]",
        collapsed ? "w-15" : "w-64"
      )}
    >
      {/* top controls */}
      <div className="flex items-center gap-2 px-3 py-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-brand-50"
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
        
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand to-brand/70 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Clydra</span>
          </div>
        )}
      </div>

      {/* new chat */}
      <button
        onClick={createThread}
        className={cn(
          "mx-3 mb-3 rounded-md bg-brand-500 py-2 text-white text-sm font-medium",
          "hover:bg-brand-600 transition",
          collapsed && "mx-2 px-2" // Adjust padding when collapsed
        )}
      >
        {collapsed ? "+" : "+ New Chat"}
      </button>

      {/* @layout-fix - search + thread list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-3">
        {!collapsed && <ThreadSearch />}
        
        {!collapsed && <ThreadList activeThread={threadId} />}
      </div>

      {/* bottom cluster */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-[#2A2A2E]">
        {!collapsed && (
          <div className="mb-3">
            <PlanBadge 
              plan={planType as "free" | "pro" | "max"} 
              onClick={() => router.push("/services")} 
            />
          </div>
        )}
        <UserChip />
      </div>
    </aside>
  );
}
