import React, { useState, useEffect } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatInterface from "./ChatInterface";
import Sheet from "./Sheet";

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
  const [activeTab, setActiveTab] = useState("chat");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Default chat usage
  const chatUsage: ChatUsage = {
    used: chatHistory.length,
    total: 500, // Example total limit
  };

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch("/api/chat/history");
        if (!response.ok) throw new Error("Failed to load chat history");
        const data = await response.json();
        setChatHistory(data);
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };

    loadChatHistory();
  }, []);

  // Load selected chat messages
  useEffect(() => {
    if (selectedChatId) {
      const selectedChat = chatHistory.find(
        (chat) => chat.id === selectedChatId
      );
      if (selectedChat) {
        setMessages(selectedChat.messages);
      }
    } else {
      setMessages([]);
    }
  }, [selectedChatId, chatHistory]);

  const handleSendMessage = async (content: string, model: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call your chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update chat history with new messages
      if (selectedChatId) {
        const updatedMessages = [...messages, userMessage, assistantMessage];
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

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await fetch(`/api/chat/history?id=${chatId}`, {
        method: "DELETE",
      });

      setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "chat":
        return (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        );
      case "history":
        return (
          <div className="flex flex-col h-full bg-bg-base">
            <div className="p-6 border-b border-border/30 bg-surface/50 backdrop-blur-sm">
              <h2 className="text-title-2 font-semibold text-text-main">
                Chat History
              </h2>
              <p className="text-body text-text-muted mt-2">
                View your previous conversations
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                {/* History Items */}
                <div className="space-y-4">
                  {chatHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-surface/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📚</span>
                      </div>
                      <h3 className="text-title-3 font-semibold text-text-main mb-2">
                        No History Yet
                      </h3>
                      <p className="text-body text-text-muted">
                        Start chatting to see your conversation history here.
                      </p>
                    </div>
                  ) : (
                    chatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                        onClick={() => handleChatSelect(chat.id)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-neo-wave">
                            <span className="text-white text-xl">💬</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="text-callout font-semibold text-text-main">
                                {chat.title}
                              </h3>
                            </div>
                            <p className="text-caption-1 text-text-muted line-clamp-2 mb-3">
                              {chat.messages[chat.messages.length - 1]
                                ?.content || "No messages"}
                            </p>
                            <div className="flex items-center space-x-4 text-caption-1 text-text-muted">
                              <span>
                                {new Date(
                                  chat.last_message_at
                                ).toLocaleTimeString()}
                              </span>
                              <span>•</span>
                              <span>{chat.model}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(chat.id);
                            }}
                            className="p-2 rounded-lg transition-all hover:bg-surface"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80">
        <ChatSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chatUsage={chatUsage}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      >
        <ChatSidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          chatUsage={chatUsage}
        />
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-border/30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-surface/60 rounded-lg"
          >
            <span className="text-2xl">☰</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </div>
    </div>
  );
}
