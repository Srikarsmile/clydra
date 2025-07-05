import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Shell, ShellRef } from "@/components/Layout/Shell";

// @performance - Dynamic import for ChatPanel to reduce initial bundle size
const ChatPanel = dynamic(() => import("@/components/Chat/ChatPanel"), {
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Loading chat...</p>
      </div>
    </div>
  ),
  ssr: false, // Disable SSR for better performance
});

interface DashboardStats {
  totalChats: number;
  totalTokens: number;
  activeModel: string;
}

function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeRoute, setActiveRoute] = useState("chat");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState<DashboardStats>({
    totalChats: 0,
    totalTokens: 0,
    activeModel: "Claude 3 Sonnet",
  });
  const shellRef = useRef<ShellRef>(null);

  // @dashboard-redesign - Get threadId from query params
  const threadId =
    typeof router.query.thread === "string" ? router.query.thread : undefined;

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // @persistence-fix - Auto-load most recent thread when no thread ID in URL
  useEffect(() => {
    if (!isLoaded || !user || threadId) {
      console.log(
        "🔄 Skipping auto-load: isLoaded =",
        isLoaded,
        "user =",
        !!user,
        "threadId =",
        threadId
      );
      return;
    }

    console.log(
      "🔍 No thread ID in URL, attempting to load most recent thread..."
    );

    const loadMostRecentThread = async () => {
      try {
        const response = await fetch("/api/threads");
        if (response.ok) {
          const threads = await response.json();
          console.log("📋 Fetched threads for auto-load:", threads.length);

          if (threads.length > 0) {
            const mostRecentThread = threads[0]; // threads are ordered by created_at desc
            console.log(
              "🎯 Redirecting to most recent thread:",
              mostRecentThread.id
            );

            router.replace(
              `/dashboard?thread=${mostRecentThread.id}`,
              undefined,
              {
                shallow: true,
              }
            );
          } else {
            console.log("ℹ️ No existing threads found, user will start fresh");
          }
        } else {
          console.error(
            "❌ Failed to load threads for auto-redirect:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error("❌ Failed to load most recent thread:", error);
      }
    };

    loadMostRecentThread();
  }, [isLoaded, user, threadId, router]);

  // Handle route changes from query params
  useEffect(() => {
    const route = router.query.tab as string;
    if (route && ["chat", "settings"].includes(route)) {
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
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    if (isLoaded && user && activeRoute !== "chat") {
      fetchStats();
    }
  }, [isLoaded, user, activeRoute]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // @dashboard-redesign - Use our new ChatPanel component directly
  return (
    <Shell ref={shellRef}>
      <ChatPanel
        threadId={threadId}
        onTokensUpdated={() => shellRef.current?.refreshTokenGauge()}
        onThreadCreated={() => shellRef.current?.refreshThreadList()}
      />
    </Shell>
  );
}

export const getServerSideProps = async () => {
  return { props: {} };
};

export default Dashboard;
