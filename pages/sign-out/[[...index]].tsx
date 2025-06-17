import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";

export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut();
        router.push("/");
      } catch (error) {
        console.error("Error signing out:", error);
        router.push("/");
      }
    };

    handleSignOut();
  }, [signOut, router]);

  return (
    <Layout>
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-neo-wave rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-semibold text-headline">R</span>
          </div>
          <h1 className="text-title-2 font-semibold text-text-main mb-2 tracking-tight">
            Signing you out...
          </h1>
          <p className="text-body text-text-muted font-normal">
            Please wait while we securely sign you out of your account.
          </p>
        </div>
      </div>
    </Layout>
  );
}
