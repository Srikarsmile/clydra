import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-surface/80 backdrop-blur-xl border border-border/50 shadow-xl",
          },
        }}
      />
    </div>
  );
}
