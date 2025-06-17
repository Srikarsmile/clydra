import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-surface/80 backdrop-blur-xl border border-border/50 shadow-xl",
              headerTitle: "text-text-main",
              headerSubtitle: "text-text-muted",
              socialButtonsBlockButton: "bg-surface border border-border/50 text-text-main hover:bg-surface/80",
              formFieldInput: "bg-surface border border-border/50 text-text-main",
              formButtonPrimary: "bg-accent hover:bg-accent/90",
              footerActionLink: "text-accent hover:text-accent/80",
            },
            variables: {
              colorPrimary: "#3B82F6",
            },
          }}
          routing="path"
          path="/sign-up"
          afterSignUpUrl="/dashboard"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
