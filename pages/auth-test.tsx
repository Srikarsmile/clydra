import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function AuthTest() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    console.log("Auth Test - isLoaded:", isLoaded);
    console.log("Auth Test - isSignedIn:", isSignedIn);
    console.log("Auth Test - user:", user);
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-main mb-4">
            Not Signed In
          </h1>
          <p className="text-text-muted mb-4">
            You need to sign in to access this page.
          </p>
          <button
            onClick={() => router.push("/sign-in")}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="bg-surface/80 backdrop-blur-xl border border-border/50 rounded-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-text-main mb-4">
          Authentication Test
        </h1>
        <div className="space-y-4">
          <div>
            <strong className="text-text-main">Status:</strong>
            <span className="text-green-600 ml-2">✅ Signed In</span>
          </div>
          <div>
            <strong className="text-text-main">User ID:</strong>
            <span className="text-text-muted ml-2">{user.id}</span>
          </div>
          <div>
            <strong className="text-text-main">Email:</strong>
            <span className="text-text-muted ml-2">
              {user.emailAddresses[0]?.emailAddress}
            </span>
          </div>
          <div>
            <strong className="text-text-main">Name:</strong>
            <span className="text-text-muted ml-2">
              {user.fullName || "Not set"}
            </span>
          </div>
          <div className="pt-4 space-y-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push("/dashboard?tab=chat")}
              className="w-full bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90"
            >
              Go to Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
