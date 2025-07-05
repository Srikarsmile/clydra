import React, { useState, useEffect } from "react";
// import Sheet from "./Sheet";  // @remove-inner-rail - no longer needed without mobile sidebar
import { useUser } from "@clerk/nextjs";
import Sidebar from "./Layout/Sidebar";

interface ChatLayoutProps {
  children?: React.ReactNode;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  model: string;
  messages: Message[];
  last_message_at: string;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { user } = useUser();
  const [, setChatHistory] = useState<ChatHistory[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch("/api/threads");
        if (response.ok) {
          const data = await response.json();
          // Transform threads data to match the expected ChatHistory interface
          const threadsAsHistory = data.map(
            (thread: { id: string; title?: string; created_at: string }) => ({
              id: thread.id,
              title: thread.title || "New Chat",
              model: "GPT-4", // Default model, this should be tracked per thread
              messages: [], // Messages will be loaded separately when thread is selected
              last_message_at: thread.created_at,
            })
          );
          setChatHistory(threadsAsHistory);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };

    if (user) {
      loadChatHistory();
    }
  }, [user]);

  // @dashboard-redesign - Handle hamburger menu toggle from chat header
  useEffect(() => {
    const handleToggleMobileSidebar = () => {
      setSidebarOpen((prev) => !prev);
    };

    window.addEventListener("toggleMobileSidebar", handleToggleMobileSidebar);
    return () => {
      window.removeEventListener(
        "toggleMobileSidebar",
        handleToggleMobileSidebar
      );
    };
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden chat-layout-container">
      {/* @dashboard-redesign - Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* @dashboard-redesign - Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[80vw] bg-white shadow-xl">
            <Sidebar />
          </div>
        </div>
      )}

      {/* @dashboard-redesign - Main content area with proper scrolling */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
