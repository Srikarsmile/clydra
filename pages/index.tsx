import Link from "next/link";
import { useState } from "react";

type ServiceKey = "image" | "video";

interface Service {
  title: string;
  description: string;
  features: string[];
  pricing: string;
  examples: string[];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ServiceKey>("image");

  const services: Record<ServiceKey, Service> = {
    image: {
      title: "AI Image Generation",
      description:
        "Create stunning visuals from text descriptions with advanced AI models",
      features: [
        "Ultra-high resolution outputs",
        "Multiple artistic styles",
        "Commercial usage rights",
        "Lightning-fast generation",
      ],
      pricing: "Starting at $0.10/image",
      examples: [
        "Product photography",
        "Marketing visuals",
        "Concept art",
        "Social media content",
      ],
    },
    video: {
      title: "AI Video Creation",
      description:
        "Generate professional videos from simple prompts with cutting-edge technology",
      features: [
        "4K video quality",
        "Custom durations",
        "Multiple formats",
        "Cinematic effects",
      ],
      pricing: "Starting at $1.40/video",
      examples: [
        "Marketing videos",
        "Social content",
        "Product animations",
        "Explainer videos",
      ],
    },
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Navigation */}
      <nav className="bg-surface/80 backdrop-blur-xl border-b border-border sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-neo-wave rounded-xl flex items-center justify-center shadow-primary-glow transition-transform duration-300 hover:scale-105 animate-float">
                <span className="text-white font-semibold text-headline">
                  R
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-title-2 font-semibold text-text-main">
                  Rivo Labs
                </span>
                <span className="text-caption-1 text-text-muted font-medium -mt-1">
                  Neo-Wave Tech
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#services"
                className="text-text-muted hover:text-primary transition-all duration-300 font-medium relative group text-callout"
              >
                Services
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
              <Link
                href="#pricing"
                className="text-text-muted hover:text-primary transition-all duration-300 font-medium relative group text-callout"
              >
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
              <Link
                href="#about"
                className="text-text-muted hover:text-primary transition-all duration-300 font-medium relative group text-callout"
              >
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/sign-in"
                className="text-text-muted hover:text-text-main font-medium transition-all duration-300 hover:scale-105 text-callout"
              >
                Sign In
              </Link>
              <Link href="/sign-up" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-wave-pattern opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-text-main mb-6 animate-fade-in-up tracking-tight">
              AI-Powered Creative
              <span className="text-gradient-neo-wave block animate-ocean-flow font-semibold">
                Services
              </span>
            </h1>
            <p className="text-title-3 md:text-title-2 text-text-muted mb-8 leading-relaxed animate-fade-in-up animation-delay-200 text-balance font-normal max-w-3xl mx-auto">
              Rivo Labs provides enterprise-grade AI services for image
              generation and video creation. Built on cutting-edge
              infrastructure for reliable, scalable results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
              <Link
                href="/sign-up"
                className="btn btn-primary btn-lg transform hover:scale-105 transition-all duration-300"
              >
                <span className="text-callout font-semibold">
                  Start Creating
                </span>
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
              </Link>
              <Link
                href="#services"
                className="btn btn-ghost btn-lg transform hover:scale-105 transition-all duration-300"
              >
                <span className="text-callout font-medium">
                  Explore Services
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-secondary/20 rounded-full blur-xl animate-float animation-delay-100"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-float animation-delay-300"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-accent/20 rounded-full blur-xl animate-float animation-delay-500"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-surface/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-large-title md:text-5xl font-semibold text-text-main mb-4 animate-fade-in-up tracking-tight">
              Why Choose Rivo Labs?
            </h2>
            <p className="text-title-3 text-text-muted max-w-3xl mx-auto animate-fade-in-up animation-delay-100 font-normal">
              Experience the future of AI-powered creativity with our
              cutting-edge platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/30 rounded-2xl flex items-center justify-center mb-6 shadow-accent-glow">
                    <svg
                      className="w-8 h-8 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                ),
                title: "Lightning Fast",
                description:
                  "Generate high-quality content in seconds with our optimized AI infrastructure and cutting-edge processing power.",
              },
              {
                icon: (
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl flex items-center justify-center mb-6 shadow-primary-glow">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                ),
                title: "Enterprise Grade",
                description:
                  "Built for scale with 99.9% uptime, enterprise-level security, and comprehensive data protection standards.",
              },
              {
                icon: (
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary/20 to-secondary/30 rounded-2xl flex items-center justify-center mb-6 shadow-wave-glow">
                    <svg
                      className="w-8 h-8 text-secondary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                      />
                    </svg>
                  </div>
                ),
                title: "Fluid Experience",
                description:
                  "Intuitive interface designed for seamless creative workflows with Apple-inspired design principles.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`group relative bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-2 animate-fade-in-up animation-delay-${(index + 2) * 100}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-secondary/[0.02] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  {feature.icon}
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

      {/* Services Section */}
      <section id="services" className="py-20 bg-bg-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-large-title md:text-5xl font-semibold text-text-main mb-4 tracking-tight">
              Our AI Services
            </h2>
            <p className="text-title-3 text-text-muted max-w-3xl mx-auto font-normal">
              Professional AI tools designed for businesses, creators, and
              developers
            </p>
          </div>

          {/* Service Tabs */}
          <div className="flex justify-center mb-12">
            <div className="bg-surface/80 backdrop-blur-xl p-2 rounded-2xl shadow-lg border border-border/50">
              {Object.entries(services).map(([key, service]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as ServiceKey)}
                  className={`px-8 py-4 rounded-xl font-medium transition-all duration-300 relative overflow-hidden text-callout ${
                    activeTab === key
                      ? "bg-primary text-white shadow-primary-glow transform scale-[1.02]"
                      : "text-text-muted hover:text-text-main hover:bg-surface/50"
                  }`}
                >
                  {activeTab === key && (
                    <span className="absolute inset-0 bg-gradient-neo-wave rounded-xl opacity-20"></span>
                  )}
                  <span className="relative z-10 font-medium">
                    {service.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Service Details */}
          <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-border/50 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.02] rounded-3xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h3 className="text-title-1 font-semibold text-text-main mb-6 tracking-tight">
                  {services[activeTab].title}
                </h3>
                <p className="text-body text-text-muted mb-8 leading-relaxed font-normal">
                  {services[activeTab].description}
                </p>

                <div className="space-y-4 mb-8">
                  {services[activeTab].features.map(
                    (feature: string, index: number) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center shadow-wave-glow flex-shrink-0">
                          <svg
                            className="w-3.5 h-3.5 text-white"
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
                        <span className="text-body text-text-main font-normal">
                          {feature}
                        </span>
                      </div>
                    )
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <Link href="/sign-up" className="btn btn-primary btn-lg">
                    <span className="text-callout font-semibold">
                      Get Started
                    </span>
                  </Link>
                  <div className="flex items-center space-x-2 px-4 py-3">
                    <span className="text-callout text-text-muted font-medium">
                      {services[activeTab].pricing}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-surface/60 backdrop-blur-sm rounded-2xl p-8 border border-border/30 shadow-lg">
                  <h4 className="text-title-3 font-semibold text-text-main mb-6 tracking-tight">
                    Use Cases
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {services[activeTab].examples.map(
                      (example: string, index: number) => (
                        <div
                          key={index}
                          className="bg-surface/80 backdrop-blur-sm rounded-xl p-4 border border-border/30 hover:border-primary/30 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.01] to-secondary/[0.01] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <span className="text-callout text-text-main font-medium relative z-10">
                            {example}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-neo-wave text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-wave-pattern opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-large-title md:text-5xl font-semibold mb-6 animate-fade-in-up tracking-tight">
            Ready to Transform Your Creative Workflow?
          </h2>
          <p className="text-title-3 mb-8 opacity-90 max-w-3xl mx-auto animate-fade-in-up animation-delay-100 font-normal leading-relaxed">
            Join thousands of creators and businesses already using Rivo Labs to
            bring their ideas to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-200">
            <Link
              href="/sign-up"
              className="btn bg-white text-primary hover:bg-white/90 btn-lg transform hover:scale-105 transition-all duration-300 shadow-xl"
            >
              <span className="text-callout font-semibold">
                Start Creating Today
              </span>
            </Link>
            <Link
              href="#pricing"
              className="btn bg-transparent text-white border-white/30 hover:bg-white/10 btn-lg transform hover:scale-105 transition-all duration-300"
            >
              <span className="text-callout font-medium">View Pricing</span>
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
                <div className="w-10 h-10 bg-gradient-neo-wave rounded-xl flex items-center justify-center shadow-primary-glow">
                  <span className="text-white font-semibold text-headline">
                    R
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-title-3 font-semibold text-text-main">
                    Rivo Labs
                  </span>
                  <span className="text-caption-1 text-text-muted font-medium -mt-1">
                    Neo-Wave Tech
                  </span>
                </div>
              </div>
              <p className="text-body text-text-muted max-w-md font-normal leading-relaxed">
                Empowering creativity through advanced AI technology. Build,
                create, and innovate with our cutting-edge platform.
              </p>
            </div>

            <div>
              <h4 className="text-headline font-semibold text-text-main mb-4">
                Services
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#services"
                    className="text-callout text-text-muted hover:text-primary transition-colors font-normal"
                  >
                    Image Generation
                  </Link>
                </li>
                <li>
                  <Link
                    href="#services"
                    className="text-callout text-text-muted hover:text-primary transition-colors font-normal"
                  >
                    Video Creation
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
                    className="text-callout text-text-muted hover:text-primary transition-colors font-normal"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-callout text-text-muted hover:text-primary transition-colors font-normal"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="#about"
                    className="text-callout text-text-muted hover:text-primary transition-colors font-normal"
                  >
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-footnote text-text-muted font-normal">
              © 2025 Rivo Labs. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-footnote text-text-muted font-medium">
                Built with Neo-Wave Tech
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
