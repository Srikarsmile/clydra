import { useState, useEffect, lazy, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { GetServerSideProps } from "next";
// Remove server-only import for client component
import { useRouter } from "next/router";
import ChatLayout from "../components/ChatLayout";
import { Container } from "../components/ui/Container";
import { Shell } from "../components/Layout/Shell";

// Lazy load components
const ChatPanel = lazy(() => import("../components/Chat/ChatPanel"));
const ThreadList = lazy(() => import("../components/Sidebar/ThreadList")); // @threads

interface DashboardStats {
  totalChats: number;
  totalTokens: number;
  activeModel: string;
}

function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeRoute, setActiveRoute] = useState("chat");
  const [stats, setStats] = useState<DashboardStats>({
    totalChats: 0,
    totalTokens: 0,
    activeModel: "Claude 3 Sonnet",
  });

  // @threads - Get threadId from query params
  const threadId =
    typeof router.query.thread === "string" ? router.query.thread : null;

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // @or Handle route changes from query params or nav
  useEffect(() => {
    const route = router.query.tab as string;
    if (route && ["chat", "image", "settings"].includes(route)) {
      setActiveRoute(route);
    }
  }, [router.query.tab]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/analytics");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.warn("Failed to fetch analytics:", response.status);
          // Keep default stats if API fails
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Gracefully handle network errors by keeping default stats
      }
    };

    // Only fetch stats if user is loaded, authenticated, and we're not on chat route
    if (isLoaded && user && activeRoute !== "chat") {
      fetchStats();
    }
  }, [isLoaded, user, activeRoute]);

  const handleRouteChange = (route: string) => {
    setActiveRoute(route);
    router.push(`/dashboard?tab=${route}`, undefined, { shallow: true });
  };

  const openUpgradeModal = () => {
    router.push("/services");
  };

  if (!isLoaded) {
    return (
      <div className="h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-body text-text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // @threads - Empty state component
  const EmptyState = () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-text-main">
          Welcome to Clydra Chat
        </h2>
        <p className="text-text-muted">
          Select a conversation or start a new one
        </p>
      </div>
    </div>
  );

  // Render ChatPanel when chat route is active
  if (activeRoute === "chat") {
    return (
      <Shell>
        <Suspense
          fallback={
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-body text-text-muted">Loading chat...</p>
              </div>
            </div>
          }
        >
          {threadId ? <ChatPanel threadId={threadId} /> : <EmptyState />}
        </Suspense>
      </Shell>
    );
  }

  // @or Keep existing ChatLayout for images (unchanged)
  return (
    <Shell>
      <div className="min-h-full bg-bg-base">
        {/* Main Content */}
        <Container>
          <div className="mx-auto max-w-[52rem] py-16 lg:py-24 flex flex-col space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-border/30">
                <h3 className="text-xs text-muted-foreground">Total Chats</h3>
                <p className="mt-2 text-3xl lg:text-5xl font-semibold text-text-main">
                  {stats.totalChats}
                </p>
              </div>
              <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-border/30">
                <h3 className="text-xs text-muted-foreground">
                  Total Tokens Used
                </h3>
                <p className="mt-2 text-3xl lg:text-5xl font-semibold text-text-main">
                  {stats.totalTokens.toLocaleString()}
                </p>
              </div>
              <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-border/30">
                <h3 className="text-xs text-muted-foreground">Active Model</h3>
                <p className="mt-2 text-base lg:text-lg text-muted-foreground">
                  {stats.activeModel}
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-4">
              <button
                onClick={() => handleRouteChange("chat")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeRoute === "chat"
                    ? "bg-primary text-white"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => handleRouteChange("image")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeRoute === "image"
                    ? "bg-primary text-white"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                🎨 Image Generation
              </button>
              <button
                onClick={() => handleRouteChange("settings")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeRoute === "settings"
                    ? "bg-primary text-white"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                ⚙️ Settings
              </button>
            </div>

            {/* Content Area */}
            <div className="bg-surface/30 backdrop-blur-sm rounded-xl border border-border/30 overflow-hidden">
              {activeRoute === "chat" && (
                <Suspense
                  fallback={
                    <div className="h-[600px] flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-body text-text-muted">
                          Loading chat...
                        </p>
                      </div>
                    </div>
                  }
                >
                  <div className="h-[600px]">
                    <ChatPanel />
                  </div>
                </Suspense>
              )}
              {activeRoute === "image" && (
                <div className="h-[600px]">
                  <ChatLayout />
                </div>
              )}
              {activeRoute === "settings" && (
                <div className="p-6">
                  <h2 className="text-3xl lg:text-5xl font-semibold text-center mb-4">
                    Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-text-muted mb-2">
                        Account
                      </h3>
                      <div className="bg-surface/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-text-main">
                              {user.emailAddresses[0]?.emailAddress}
                            </p>
                            <p className="text-xs text-text-muted mt-1">
                              Pro Plan
                            </p>
                          </div>
                          <button
                            onClick={openUpgradeModal}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                          >
                            Manage Subscription
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-text-muted mb-2">
                        API Access
                      </h3>
                      <div className="bg-surface/50 rounded-lg p-4">
                        <p className="text-sm text-text-main mb-2">
                          Your API Key
                        </p>
                        <div className="flex items-center space-x-2">
                          <input
                            type="password"
                            value="••••••••••••••••"
                            readOnly
                            className="flex-1 bg-surface px-3 py-2 rounded-lg text-text-muted text-sm"
                          />
                          <button className="px-3 py-2 bg-surface hover:bg-surface/80 rounded-lg text-text-main text-sm">
                            Show
                          </button>
                          <button className="px-3 py-2 bg-surface hover:bg-surface/80 rounded-lg text-text-main text-sm">
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>
    </Shell>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // Since we're using Clerk on client side, we don't need buildClerkProps
  return { props: {} };
};

export default Dashboard;
