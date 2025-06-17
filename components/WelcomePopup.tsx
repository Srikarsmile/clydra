import useSWR from "swr";
import { useState, useEffect } from "react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch");
  }
  return res.json();
};

export default function WelcomePopup() {
  const { data, error } = useSWR("/api/credits", fetcher);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (error || !data) return;

    // Show popup for first-time users who haven't used any credits
    const isNewUser = data.imagesUsed === 0 && data.secondsUsed === 0;
    const hasSeenWelcome = localStorage.getItem("rivoWelcomeShown") === "1";

    if (isNewUser && !hasSeenWelcome) {
      // Small delay to let the page load
      setTimeout(() => {
        setShowPopup(true);
      }, 500);
    }
  }, [data, error]);

  const closePopup = () => {
    setShowPopup(false);
    localStorage.setItem("rivoWelcomeShown", "1");
  };

  if (!showPopup || !data) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="relative bg-surface rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border/50 animate-in zoom-in-95 duration-300">
          {/* Close button */}
          <button
            onClick={closePopup}
            className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Party animation */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <div className="flex justify-center space-x-2 text-3xl mb-4">
              <span className="animate-pulse">🎊</span>
              <span className="animate-pulse delay-100">✨</span>
              <span className="animate-pulse delay-200">🎈</span>
              <span className="animate-pulse delay-300">🎯</span>
              <span className="animate-pulse delay-75">🚀</span>
            </div>
          </div>

          {/* Content */}
          <div className="text-center">
            <h2 className="text-title-1 font-semibold text-text-main mb-3 tracking-tight">
              Welcome to Rivo Labs!
            </h2>

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6 border border-primary/20">
              <div className="text-4xl font-bold text-primary mb-2">
                ${data.balanceUsd}
              </div>
              <div className="text-callout text-text-main font-medium mb-1">
                Free Credits Added! 🎁
              </div>
              <div className="text-caption-1 text-text-muted">
                Start creating amazing AI content right away
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-caption-1">
              <div className="bg-secondary/10 rounded-xl p-3 border border-secondary/20">
                <div className="font-semibold text-secondary">
                  {data.imageCap} Images
                </div>
                <div className="text-text-muted">Imagen 4 AI</div>
              </div>
              <div className="bg-accent/10 rounded-xl p-3 border border-accent/20">
                <div className="font-semibold text-accent">2 Videos (5s)</div>
                <div className="text-text-muted">or 1 Video (10s)</div>
              </div>
            </div>

            <button
              onClick={closePopup}
              className="w-full btn btn-primary btn-lg"
            >
              Start Creating! 🚀
            </button>
          </div>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            {["🎉", "✨", "🎊", "🎈", "⭐", "💫"][i]}
          </div>
        ))}
      </div>
    </>
  );
}
