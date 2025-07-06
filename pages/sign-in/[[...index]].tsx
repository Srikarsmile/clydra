import { SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl rounded-lg",
              headerTitle: "text-gray-900",
              headerSubtitle: "text-gray-600",
              socialButtonsBlockButton:
                "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50",
              formFieldInput:
                "bg-white border border-gray-200 text-gray-900",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
              footerActionLink: "text-blue-600 hover:text-blue-700",
            },
            variables: {
              colorPrimary: "#3B82F6",
              colorBackground: "#ffffff",
              colorText: "#111827",
              colorTextSecondary: "#6B7280",
            },
          }}
          routing="path"
          path="/sign-in"
          afterSignInUrl="/dashboard"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
