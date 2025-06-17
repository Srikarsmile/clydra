import { useState, useEffect, lazy, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { GetServerSideProps } from "next";
import { buildClerkProps } from "@clerk/nextjs/server";
import { useRouter } from "next/router";
import ChatLayout from "../components/ChatLayout";

// @or Lazy load ChatPanel
const ChatPanel = lazy(() => import("../components/ChatPanel"));

function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeRoute, setActiveRoute] = useState("chat");

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // @or Handle route changes from query params or nav
  useEffect(() => {
    const route = router.query.tab as string;
    if (route && ["chat", "image"].includes(route)) {
      setActiveRoute(route);
    }
  }, [router.query.tab]);

  const handleRouteChange = (route: string) => {
    setActiveRoute(route);
    router.push(`/dashboard?tab=${route}`, undefined, { shallow: true });
  };

  const openUpgradeModal = () => {
    // @or TODO: Implement upgrade modal
    console.log("Opening upgrade modal...");
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

  // @or Render ChatPanel when chat route is active
  if (activeRoute === "chat") {
    return (
      <div className="h-screen bg-bg-base">
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
          <ChatPanel 
            onUpgradeClick={openUpgradeModal}
            userPlan="pro" // @or Temporarily set to pro to unlock all models
          />
        </Suspense>
      </div>
    );
  }

  // @or Keep existing ChatLayout for images (unchanged)
  return (
    <div className="h-screen bg-bg-base">
      <ChatLayout />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return { props: { ...buildClerkProps(ctx.req) } };
};

export default Dashboard;
