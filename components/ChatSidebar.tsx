import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Image from "next/image";

interface ChatSidebarProps {
  userName: string;
  userEmail: string;
  onNewChat: () => void;
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

export default function ChatSidebar({
  userName,
  userEmail,
  onNewChat,
  selectedTab,
  onTabChange,
}: ChatSidebarProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    chatsToday: 0,
    tokensUsed: 0,
  });

  const tabs = [
    { id: "chat", name: "Chat", icon: "💬" },
    { id: "settings", name: "Settings", icon: "⚙️" },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/analytics");
        if (response.ok) {
          const data = await response.json();
          setStats({
            chatsToday: data.chatsToday || 0,
            tokensUsed: data.tokensUsed || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="w-80 bg-surface/30 backdrop-blur-xl border-r border-border/30 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center space-x-3">
          {user?.imageUrl && user.imageUrl.trim() !== "" && (
            <Image
              src={user.imageUrl}
              alt={userName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-main truncate">
              {userName}
            </p>
            <p className="text-xs text-text-muted truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
        >
          New Chat
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4">
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                selectedTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:text-text-main hover:bg-surface/50"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 mt-auto border-t border-border/30">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Chats today:</span>
            <span className="text-text-main font-medium">
              {isLoading ? "..." : stats.chatsToday}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Tokens used:</span>
            <span className="text-text-main font-medium">
              {isLoading ? "..." : stats.tokensUsed.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
