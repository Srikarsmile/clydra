import React, { useState, useEffect } from "react";
import ChatInterface from "./ChatInterface";
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

interface ChatUsage {
  used: number;
  total: number;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch("/api/threads");
        if (response.ok) {
          const data = await response.json();
          // Transform threads data to match the expected ChatHistory interface
          const threadsAsHistory = data.map((thread: any) => ({
            id: thread.id,
            title: thread.title || "New Chat",
            model: "GPT-4", // Default model, this should be tracked per thread
            messages: [], // Messages will be loaded separately when thread is selected
            last_message_at: thread.created_at,
          }));
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

  // Note: Messages are now loaded directly in handleChatSelect function

  const handleSendMessage = async (content: string, model: string) => {
    if (!content.trim() || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Call your chat API here
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          model,
          threadId: selectedChatId,
          messages: [...messages, newMessage],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };

        const updatedMessages = [...messages, newMessage, assistantMessage];
        setMessages(updatedMessages);

        // Update chat history if this is part of an existing chat
        if (selectedChatId) {
          await fetch("/api/chat/history", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: selectedChatId,
              messages: updatedMessages,
            }),
          });

          // Update local chat history
          setChatHistory((prev) =>
            prev.map((chat) =>
              chat.id === selectedChatId
                ? {
                    ...chat,
                    messages: updatedMessages,
                    last_message_at: new Date().toISOString(),
                  }
                : chat
            )
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setSelectedChatId(null);
    setMessages([]);
  };

  const handleChatSelect = async (chatId: string) => {
    setSelectedChatId(chatId);

    // Load messages for the selected thread
    try {
      const response = await fetch(`/api/messages/${chatId}`);
      if (response.ok) {
        const messagesData = await response.json();
        // Transform messages to match the expected interface
        const transformedMessages = messagesData.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch("/api/threads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: chatId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to delete chat: ${response.status} - ${errorData.error}`
        );
      }

      setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      // You could add user-facing error notification here
    }
  };

  // @remove-inner-rail - simplified to always render chat interface without tab switching
  const renderContent = () => {
    return (
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    );
  };

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
