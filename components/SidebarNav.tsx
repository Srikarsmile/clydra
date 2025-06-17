import { useRouter } from "next/router";
import Link from "next/link";

interface NavItem {
  id: string;
  name: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  enabled?: boolean;
}

interface SidebarNavProps {
  activeRoute?: string;
  onRouteChange?: (route: string) => void;
}

export default function SidebarNav({
  activeRoute = "image",
  onRouteChange,
}: SidebarNavProps) {
  const router = useRouter();
  const isChatEnabled = process.env.NEXT_PUBLIC_CHAT_ENABLED === "true";

  const navItems: NavItem[] = [
    {
      id: "chat",
      name: "Chat",
      icon: "💬",
      enabled: true,
    },
    {
      id: "image",
      name: "Images",
      icon: "🎨",
      enabled: true,
    },
    {
      id: "analytics",
      name: "Analytics",
      icon: "📊",
      href: "/analytics",
      enabled: false, // Coming soon
    },
    {
      id: "settings",
      name: "Settings",
      icon: "⚙️",
      href: "/settings",
      enabled: false, // Coming soon
    },
  ];

  const handleItemClick = (item: NavItem) => {
    if (!item.enabled) {
      // Show "coming soon" toast or similar
      return;
    }

    if (item.href) {
      router.push(item.href);
    } else if (onRouteChange) {
      onRouteChange(item.id);
    }
  };

  return (
    <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-6 border border-border/50 shadow-lg">
      <h3 className="text-title-3 font-semibold text-text-main mb-6 tracking-tight">
        AI Services
      </h3>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            disabled={!item.enabled}
            className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${
              activeRoute === item.id && item.enabled
                ? "border-primary bg-primary/5 shadow-primary-glow"
                : item.enabled
                  ? "border-border/30 bg-surface/60 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
                  : "border-border/20 bg-surface/30 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  activeRoute === item.id && item.enabled
                    ? "bg-primary/20 shadow-primary-glow"
                    : item.enabled
                      ? "bg-surface/80 group-hover:bg-primary/10"
                      : "bg-surface/50"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
              </div>

              <div className="flex-1">
                <h4
                  className={`text-callout font-semibold transition-colors duration-200 ${
                    activeRoute === item.id && item.enabled
                      ? "text-primary"
                      : item.enabled
                        ? "text-text-main group-hover:text-primary"
                        : "text-text-muted"
                  }`}
                >
                  {item.name}
                </h4>

                <p
                  className={`text-caption-1 font-normal mt-1 ${
                    item.enabled ? "text-text-muted" : "text-text-muted/60"
                  }`}
                >
                  {item.id === "chat" && "Multi-model AI conversations"}
                  {item.id === "image" && "Create stunning images from text"}
                  {item.id === "analytics" && "Usage insights and metrics"}
                  {item.id === "settings" && "Account and preferences"}
                </p>

                {!item.enabled && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-accent/10 text-accent rounded-full font-medium">
                    Coming Soon
                  </span>
                )}
              </div>

              {item.enabled && (
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeRoute === item.id
                      ? "bg-primary shadow-primary-glow"
                      : "bg-transparent group-hover:bg-primary/40"
                  }`}
                />
              )}
            </div>
          </button>
        ))}
      </nav>

      {/* Quick Stats */}
      <div className="mt-8 pt-6 border-t border-border/30">
        <h4 className="text-callout font-semibold text-text-main mb-3">
          Quick Stats
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-caption-1">
            <span className="text-text-muted">This Month</span>
            <span className="text-text-main font-medium">Active</span>
          </div>
          <div className="flex justify-between items-center text-caption-1">
            <span className="text-text-muted">Plan</span>
            <span className="text-primary font-medium">Free</span>
          </div>
        </div>
      </div>
    </div>
  );
}
