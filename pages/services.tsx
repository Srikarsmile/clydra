import Layout from "../components/Layout";
import Link from "next/link";
import { useState } from "react";

export default function Services() {
  const [showToast, setShowToast] = useState(false);

  const showComingSoonToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "",
      description: "Perfect for getting started with AI chat",
      features: [
        "GPT-4o Mini",
        "DeepSeek R1",
        "Gemini 2.5 Flash",
        "40,000 tokens/day",
        "Basic support",
      ],
      cta: "Current Plan",
      ctaClass: "btn btn-ghost",
      ctaAction: () => {},
      popular: false,
    },
    {
      name: "Pro",
      price: "$15",
      period: "/mo",
      description: "For power users and professionals",
      features: [
        "1.5M tokens/month",
        "GPT-4o (Latest)",
        "Claude Sonnet 4",
        "Grok 3 Beta",
        "Gemini 2.5 Pro",
        "🌐 Web Search on all models",
        "Priority support",
      ],
      cta: "Coming Soon",
      ctaClass: "btn btn-primary",
      ctaAction: showComingSoonToast,
      popular: true,
    },
    {
      name: "Max",
      price: "$59",
      period: "/mo",
      description: "For teams and intensive usage",
      features: [
        "5M tokens/month",
        "All Pro features",
        "🌐 Advanced Web Search",
        "Team collaboration",
        "API access",
        "24/7 support",
        "Custom integrations",
      ],
      cta: "Coming Soon",
      ctaClass: "btn btn-primary",
      ctaAction: showComingSoonToast,
      popular: false,
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-bg-base">
        {/* Toast */}
        {showToast && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-accent text-white px-6 py-3 rounded-lg shadow-lg">
            Checkout coming soon!
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-large-title font-semibold mb-4 tracking-tight">
                Simple, Transparent Pricing
              </h1>
              <p className="text-title-3 font-normal opacity-90 max-w-3xl mx-auto">
                Choose the perfect plan for your AI chat needs
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? "border-primary shadow-primary-glow scale-105"
                    : "border-border/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-title-2 font-semibold text-text-main mb-2 tracking-tight">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl font-bold text-text-main">
                      {plan.price}
                    </span>
                    <span className="text-text-muted text-lg ml-1">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-text-muted">{plan.description}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
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
                      <span className="text-callout text-text-main">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={plan.ctaAction}
                  className={`w-full ${plan.ctaClass} ${plan.popular ? "btn-lg" : ""}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-title-1 font-semibold text-text-main mb-4 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-body text-text-muted max-w-2xl mx-auto">
                Everything you need to know about our pricing and plans
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                <h4 className="text-callout font-semibold text-text-main mb-3">
                  What happens when I exceed my token limit?
                </h4>
                <p className="text-caption-1 text-text-muted">
                  You can upgrade to a higher plan anytime. Your usage resets
                  automatically each month.
                </p>
              </div>

              <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                <h4 className="text-callout font-semibold text-text-main mb-3">
                  Can I change plans anytime?
                </h4>
                <p className="text-caption-1 text-text-muted">
                  Yes! You can upgrade or downgrade your plan at any time.
                  Changes take effect immediately.
                </p>
              </div>

              <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                <h4 className="text-callout font-semibold text-text-main mb-3">
                  Do tokens roll over?
                </h4>
                <p className="text-caption-1 text-text-muted">
                  Tokens reset to full quota on the 1st of each month. Monthly
                  limits ensure fair usage across all users.
                </p>
              </div>

              <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                <h4 className="text-callout font-semibold text-text-main mb-3">
                  Do you offer a free trial?
                </h4>
                <p className="text-caption-1 text-text-muted">
                  Yes! Every new user gets access to our Free plan with daily
                  token allowance to try Clydra.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
