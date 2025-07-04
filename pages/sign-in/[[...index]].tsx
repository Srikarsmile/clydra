import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-surface/80 backdrop-blur-xl border border-border/50 shadow-xl",
              headerTitle: "text-text-main",
              headerSubtitle: "text-text-muted",
              socialButtonsBlockButton:
                "bg-surface border border-border/50 text-text-main hover:bg-surface/80",
              formFieldInput:
                "bg-surface border border-border/50 text-text-main",
              formButtonPrimary: "bg-accent hover:bg-accent/90",
              footerActionLink: "text-accent hover:text-accent/80",
            },
            variables: {
              colorPrimary: "#3B82F6",
            },
          }}
          routing="path"
          path="/sign-in"
          afterSignInUrl="/dashboard?tab=chat"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard?tab=chat"
        />
      </div>
    </div>
  );
}
