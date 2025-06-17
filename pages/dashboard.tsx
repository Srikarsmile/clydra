import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { GetServerSideProps } from "next";
import { buildClerkProps } from "@clerk/nextjs/server";
import { useRouter } from "next/router";
import ChatLayout from "../components/ChatLayout";

function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

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

  return <ChatLayout />;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return { props: { ...buildClerkProps(ctx.req) } };
};

export default Dashboard;
