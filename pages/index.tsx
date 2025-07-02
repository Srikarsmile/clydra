import Link from "next/link";
import { useState } from "react";
import PageTransition from "../components/PageTransition";

export default function Home() {
  const features = [
    {
      title: "GPT-4o & Claude Sonnet",
      description:
        "Access the most advanced AI models including GPT-4o, Claude Sonnet, and Gemini through our unified interface",
      icon: "🧠",
    },
    {
      title: "Stream Responses",
      description:
        "Get real-time streaming responses for natural, conversational interactions with minimal wait time",
      icon: "⚡",
    },
    {
      title: "Smart Usage Tracking",
      description:
        "Built-in token usage monitoring with daily limits and transparent pricing across all models",
      icon: "📊",
    },
  ];

  const models = [
    {
      name: "GPT-3.5 Turbo",
      status: "Free",
      description: "Fast, reliable responses for everyday tasks",
    },
    {
      name: "GPT-4o",
      status: "Pro",
      description: "Most advanced reasoning and complex problem solving",
    },
    {
      name: "Claude Sonnet",
      status: "Pro",
      description: "Superior writing and analysis capabilities",
    },
    {
      name: "Gemini Pro",
      status: "Pro",
      description: "Multimodal AI with advanced understanding",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-base">
        {/* Navigation */}
        <nav className="glass border-b border-border sticky top-0 z-50 nav-item animate-slide-in-top">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#0BA5EC] rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105 animate-float">
                  <span className="text-white font-semibold text-headline">
                    C
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-title-2 font-semibold text-text-main">
                    Clydra
                  </span>
                  <span className="text-caption-1 text-text-muted font-medium -mt-1">
                    AI Chat Platform
                  </span>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-8">
                <Link
                  href="#models"
                  className="text-text-muted hover:text-[#0BA5EC] transition-all duration-300 font-medium relative group text-callout"
                >
                  Models
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0BA5EC] transition-all duration-300 group-hover:w-full rounded-full"></span>
                </Link>
                <Link
                  href="#features"
                  className="text-text-muted hover:text-[#0BA5EC] transition-all duration-300 font-medium relative group text-callout"
                >
                  Features
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0BA5EC] transition-all duration-300 group-hover:w-full rounded-full"></span>
                </Link>
                <Link
                  href="#pricing"
                  className="text-text-muted hover:text-[#0BA5EC] transition-all duration-300 font-medium relative group text-callout"
                >
                  Pricing
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0BA5EC] transition-all duration-300 group-hover:w-full rounded-full"></span>
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <Link
                  href="/sign-in"
                  className="text-text-muted hover:text-text-main font-medium transition-all duration-300 hover:scale-105 text-callout"
                >
                  Sign In
                </Link>
                <Link href="/sign-up" className="btn-primary-professional">
                  Start Chatting
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-20 pb-16 relative overflow-hidden section-container">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-wave-pattern opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#0BA5EC]/5 via-transparent to-[#0BA5EC]/10"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-text-main mb-6 animate-fade-in-up tracking-tight">
                Chat with
                <span className="text-[#0BA5EC] block animate-ocean-flow font-semibold">
                  Advanced AI
                </span>
              </h1>
              <p className="text-title-3 md:text-title-2 text-text-muted mb-8 leading-relaxed animate-fade-in-up animation-delay-200 text-balance font-normal max-w-3xl mx-auto">
                Access GPT-4o, Claude Sonnet, and Gemini through one beautiful
                interface. Get 40 free messages daily, then upgrade for
                unlimited access to all models.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
                <Link
                  href="/sign-up"
                  className="btn-primary-professional text-lg px-8 py-4 animate-button-pulse"
                >
                  <span className="flex items-center">
                    Start Chatting Free
                    <svg
                      className="w-5 h-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="#models"
                  className="btn-secondary-professional text-lg px-8 py-4"
                >
                  Explore Models
                </Link>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-[#0BA5EC]/20 rounded-full blur-xl animate-float animation-delay-100"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-[#0BA5EC]/10 rounded-full blur-xl animate-float animation-delay-300"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-[#0BA5EC]/15 rounded-full blur-xl animate-float animation-delay-500"></div>
        </section>

        {/* AI Models Section */}
        <section id="models" className="py-20 bg-surface/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-large-title md:text-5xl font-semibold text-text-main mb-4 animate-fade-in-up tracking-tight">
                Premium AI Models
              </h2>
              <p className="text-title-3 text-text-muted max-w-3xl mx-auto animate-fade-in-up animation-delay-100 font-normal">
                Access the world's most advanced AI models through our unified
                chat interface
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-stagger">
              {models.map((model, index) => (
                <div
                  key={index}
                  className={`group relative bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 hover:shadow-xl hover:-translate-y-2 animate-fade-in-up animation-delay-${(index + 2) * 100} ${
                    model.status === "Free"
                      ? "border-[#0BA5EC]/30 hover:border-[#0BA5EC]/50"
                      : "border-border/50 hover:border-[#0BA5EC]/30"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0BA5EC]/[0.02] to-[#0BA5EC]/[0.05] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-title-3 font-semibold text-text-main">
                        {model.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          model.status === "Free"
                            ? "bg-[#0BA5EC] text-white"
                            : "bg-surface text-text-muted border border-border"
                        }`}
                      >
                        {model.status}
                      </span>
                    </div>
                    <p className="text-body text-text-muted leading-relaxed font-normal">
                      {model.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-bg-base">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-large-title md:text-5xl font-semibold text-text-main mb-4 tracking-tight">
                Why Choose Clydra?
              </h2>
              <p className="text-title-3 text-text-muted max-w-3xl mx-auto font-normal">
                Experience the future of AI conversation with our advanced
                features
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-stagger">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`group relative bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border border-border/50 hover:border-[#0BA5EC]/30 transition-all duration-500 hover:shadow-xl hover:shadow-[#0BA5EC]/5 hover:-translate-y-2 animate-fade-in-up animation-delay-${(index + 2) * 100}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0BA5EC]/[0.02] to-[#0BA5EC]/[0.02] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#0BA5EC]/20 to-[#0BA5EC]/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg text-2xl">
                      {feature.icon}
                    </div>
                    <h3 className="text-title-2 font-semibold text-text-main mb-4 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-body text-text-muted leading-relaxed font-normal">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-surface/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-large-title md:text-5xl font-semibold text-text-main mb-4 tracking-tight">
                Simple, Fair Pricing
              </h2>
              <p className="text-title-3 text-text-muted max-w-3xl mx-auto font-normal">
                Start free, upgrade when you need more
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="card-professional p-8 relative animate-slide-in-left">
                <h3 className="text-title-1 font-semibold text-text-main mb-2">
                  Free
                </h3>
                <div className="text-3xl font-semibold text-text-main mb-6">
                  ₹0
                  <span className="text-body text-text-muted font-normal">
                    /month
                  </span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-[#0BA5EC] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-main">40 messages per day</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-[#0BA5EC] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-main">GPT-3.5 Turbo access</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-[#0BA5EC] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-main">Chat history</span>
                  </li>
                </ul>
                <Link
                  href="/sign-up"
                  className="btn-secondary-professional w-full text-center"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="card-glass p-8 relative animate-slide-in-right bg-gradient-to-br from-[#0BA5EC]/5 to-[#0BA5EC]/10 border-[#0BA5EC]/30">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#0BA5EC] text-white px-4 py-1 rounded-full text-sm font-medium">
                    Popular
                  </span>
                </div>
                <h3 className="text-title-1 font-semibold text-text-main mb-2">
                  Pro
                </h3>
                <div className="text-3xl font-semibold text-text-main mb-6">
                  ₹799
                  <span className="text-body text-text-muted font-normal">
                    /month
                  </span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-[#0BA5EC] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-main">Unlimited messages</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-[#0BA5EC] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-main">
                      GPT-4o, Claude Sonnet, Gemini
                    </span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-[#0BA5EC] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-main">Priority support</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-[#0BA5EC] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-main">Advanced features</span>
                  </li>
                </ul>
                <Link
                  href="/sign-up"
                  className="btn-primary-professional w-full text-center"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-[#0BA5EC] to-[#0BA5EC]/80 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-wave-pattern opacity-20"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-large-title md:text-5xl font-semibold mb-6 animate-fade-in-up tracking-tight">
              Ready to Start Chatting?
            </h2>
            <p className="text-title-3 mb-8 opacity-90 max-w-3xl mx-auto animate-fade-in-up animation-delay-100 font-normal leading-relaxed">
              Join thousands of users already using Clydra to have meaningful
              conversations with AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-200">
              <Link
                href="/sign-up"
                className="bg-white text-[#0BA5EC] hover:bg-white/90 px-8 py-4 rounded-xl font-semibold text-lg transform hover:scale-105 transition-all duration-300 shadow-xl"
              >
                Start Free Today
              </Link>
              <Link
                href="#pricing"
                className="bg-transparent text-white border-2 border-white/30 hover:bg-white/10 px-8 py-4 rounded-xl font-medium text-lg transform hover:scale-105 transition-all duration-300"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-surface/80 backdrop-blur-md border-t border-border py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-[#0BA5EC] rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-semibold text-headline">
                      C
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-title-3 font-semibold text-text-main">
                      Clydra
                    </span>
                    <span className="text-caption-1 text-text-muted font-medium -mt-1">
                      AI Chat Platform
                    </span>
                  </div>
                </div>
                <p className="text-body text-text-muted max-w-md font-normal leading-relaxed">
                  Chat with the world's most advanced AI models through our
                  beautiful, unified interface.
                </p>
              </div>

              <div>
                <h4 className="text-headline font-semibold text-text-main mb-4">
                  Product
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#models"
                      className="text-callout text-text-muted hover:text-[#0BA5EC] transition-colors font-normal"
                    >
                      AI Models
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#features"
                      className="text-callout text-text-muted hover:text-[#0BA5EC] transition-colors font-normal"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#pricing"
                      className="text-callout text-text-muted hover:text-[#0BA5EC] transition-colors font-normal"
                    >
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-headline font-semibold text-text-main mb-4">
                  Company
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/privacy"
                      className="text-callout text-text-muted hover:text-[#0BA5EC] transition-colors font-normal"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="text-callout text-text-muted hover:text-[#0BA5EC] transition-colors font-normal"
                    >
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border pt-8 mt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-callout text-text-muted font-normal">
                  © 2024 Clydra. All rights reserved.
                </p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                  <span className="text-callout text-text-muted font-normal">
                    Made with ❤️ for AI enthusiasts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
