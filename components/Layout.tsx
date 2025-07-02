import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import PageTransition from "./PageTransition";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "🏠" },
    { name: "Services", href: "/services", icon: "🎨" },
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
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-large-title text-text-main group-hover:text-primary transition-colors duration-200">
                    Clydra
                  </span>
                  <span className="text-caption-1 text-text-muted -mt-1">
                    AI Chat Platform
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
                    prefetch={true}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-callout font-medium transition-all duration-150 ${
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

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isSignedIn ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-right">
                    <div className="text-callout font-medium text-text-main">
                      Chat with AI
                    </div>
                    <div className="text-caption-1 text-text-muted">
                      Clydra Platform
                    </div>
                  </div>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox:
                          "w-10 h-10 shadow-primary-glow hover:shadow-primary-glow-lg transition-all duration-200",
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
                  <Link href="/sign-up" className="btn btn-primary">
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
                  prefetch={true}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-callout font-medium transition-all duration-150 ${
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
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-surface/80 backdrop-blur-md border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">C</span>
              </div>
              <div className="flex flex-col">
                <span className="text-title-3 text-text-main">Clydra</span>
                <span className="text-caption-1 text-text-muted -mt-1">
                  AI Chat Platform
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-callout text-text-muted">
              <Link
                href="/privacy"
                className="hover:text-primary transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-primary transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <Link
                href="/support"
                className="hover:text-primary transition-colors duration-200"
              >
                Support
              </Link>
            </div>

            <div className="text-callout text-text-muted mt-4 md:mt-0">
              © 2025 Clydra. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
