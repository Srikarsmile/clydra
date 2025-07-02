import { MessageCircle, Settings } from "lucide-react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

interface SidebarNavProps {
  className?: string;
  activeRoute?: string;
  onRouteChange?: (route: string) => void;
}

export default function SidebarNav({
  className,
  activeRoute = "chat",
  onRouteChange,
}: SidebarNavProps) {
  const router = useRouter();
  const { user } = useUser();
  const [usage, setUsage] = useState({ used: 0, limit: 1500000 });

  const navigationItems = [
    {
      id: "chat",
      name: "Chat",
      icon: <MessageCircle className="w-5 h-5" />,
      description: "Have conversations with AI",
    },
    {
      id: "settings",
      name: "Settings",
      icon: <Settings className="w-5 h-5" />,
      description: "Manage your account",
    },
  ];

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch("/api/tokens/current");
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (error) {
        console.error("Error fetching usage:", error);
      }
    };

    if (user) {
      fetchUsage();
    }
  }, [user]);

  const handleRouteChange = (route: string) => {
    if (onRouteChange) {
      onRouteChange(route);
    } else {
      router.push(`/dashboard?tab=${route}`);
    }
  };

  const usagePercentage = Math.round((usage.used / usage.limit) * 100);

  return (
    <nav className={`space-y-1 ${className}`}>
      {navigationItems.map((item) => (
        <div key={item.id}>
          <button
            onClick={() => handleRouteChange(item.id)}
            className={`group w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeRoute === item.id
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text-main hover:bg-surface/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <span
                className={`transition-colors ${
                  activeRoute === item.id
                    ? "text-white"
                    : "text-text-muted group-hover:text-text-main"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.name}</span>
            </div>
          </button>

          {/* Show description on hover/active */}
          {activeRoute === item.id && (
            <div className="mt-1 px-9">
              <p className="text-xs text-text-muted">{item.description}</p>
            </div>
          )}
        </div>
      ))}

      {/* Usage Summary */}
      <div className="pt-4 mt-4 border-t border-border/30">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-muted">
              Token Usage
            </span>
            <span className="text-xs text-text-main">
              {usage.used.toLocaleString()} / {usage.limit.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-surface/60 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-primary to-primary-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-text-muted mt-1">
            {usagePercentage}% used this month
          </p>
        </div>
      </div>
    </nav>
  );
}
