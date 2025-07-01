import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { Shell } from "../components/Layout/Shell";
import ChatPanel from "../components/Chat/ChatPanel"; // @dashboard-redesign

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

  // @dashboard-redesign - Get threadId from query params
  const threadId =
    typeof router.query.thread === "string" ? router.query.thread : undefined;

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

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
    <Shell>
      <ChatPanel threadId={threadId} />
    </Shell>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default Dashboard;
