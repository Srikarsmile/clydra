import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  // Dark mode persistence
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? JSON.parse(saved) : prefersDark;
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "🏠" },
    { name: "Services", href: "/services", icon: "🎨" },
    { name: "Analytics", href: "/analytics", icon: "📊" },
    { name: "Documentation", href: "/docs", icon: "📚" },
  ];

  return (
    <div className="min-h-screen bg-bg-base transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-surface border-b border-border shadow-sm backdrop-blur-md bg-surface/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-neo-wave rounded-xl flex items-center justify-center shadow-primary-glow group-hover:shadow-primary-glow-lg transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-large-title text-text-main group-hover:text-primary transition-colors duration-200">
                    Rivo Labs
                  </span>
                  <span className="text-caption-1 text-text-muted -mt-1">
                    Neo-Wave Tech
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            {isSignedIn && (
              <div className="hidden md:flex items-center space-x-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-callout font-medium transition-all duration-200 ${
                      router.pathname === item.href
                        ? "bg-primary text-white shadow-primary-glow"
                        : "text-text-muted hover:text-text-main hover:bg-surface/50"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* User Menu & Dark Mode Toggle */}
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-surface border border-border hover:bg-surface/80 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {isSignedIn ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-right">
                    <div className="text-callout font-medium text-text-main">
                      AI Services
                    </div>
                    <div className="text-caption-1 text-text-muted">
                      Platform
                    </div>
                  </div>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 shadow-primary-glow hover:shadow-primary-glow-lg transition-all duration-200",
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/sign-in"
                    className="text-text-muted hover:text-text-main font-medium text-callout transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="btn btn-primary"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isSignedIn && (
          <div className="md:hidden border-t border-border bg-surface/50 backdrop-blur-sm">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-callout font-medium transition-all duration-200 ${
                    router.pathname === item.href
                      ? "bg-primary text-white shadow-primary-glow"
                      : "text-text-muted hover:text-text-main hover:bg-surface/50"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="relative">
        {/* Background Pattern */}
        <div className="fixed inset-0 bg-wave-pattern opacity-30 pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-surface/80 backdrop-blur-md border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-neo-wave rounded-lg flex items-center justify-center shadow-primary-glow">
                <span className="text-white font-bold">R</span>
              </div>
              <div className="flex flex-col">
                <span className="text-title-3 text-text-main">Rivo Labs</span>
                <span className="text-caption-1 text-text-muted -mt-1">Neo-Wave Tech</span>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-callout text-text-muted">
              <Link href="/privacy" className="hover:text-primary transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors duration-200">
                Terms of Service
              </Link>
              <Link href="/support" className="hover:text-primary transition-colors duration-200">
                Support
              </Link>
            </div>

            <div className="text-callout text-text-muted mt-4 md:mt-0">
              © 2024 Rivo Labs. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
