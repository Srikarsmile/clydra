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
      description: "Perfect for getting started",
      features: [
        "30 images",
        "20 seconds video",
        "Standard quality",
        "Basic support",
      ],
      cta: "Current Plan",
      ctaClass: "btn btn-ghost",
      ctaAction: () => {},
      popular: false,
    },
    {
      name: "Creator",
      price: "$15",
      period: "/mo",
      description: "For content creators",
      features: [
        "500 images",
        "250 seconds video",
        "HD quality",
        "Priority support",
        "Custom styles",
        "Commercial rights",
      ],
      cta: "Coming Soon",
      ctaClass: "btn btn-primary",
      ctaAction: showComingSoonToast,
      popular: true,
    },
    {
      name: "Pro",
      price: "$59",
      period: "/mo",
      description: "For professional teams",
      features: [
        "5,000 images",
        "2,500 seconds video",
        "Ultra HD quality",
        "24/7 support",
        "Advanced features",
        "Team collaboration",
        "API access",
        "Priority processing",
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
        <div className="bg-gradient-neo-wave text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-large-title font-semibold mb-4 tracking-tight">
                Simple, Transparent Pricing
              </h1>
              <p className="text-title-3 font-normal opacity-90 max-w-3xl mx-auto">
                Choose the perfect plan for your creative needs
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
                  What happens when I exceed my plan limits?
                </h4>
                <p className="text-caption-1 text-text-muted">
                  You can purchase additional credits or upgrade to a higher
                  plan anytime. No generation requests are blocked.
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
                  Do credits roll over?
                </h4>
                <p className="text-caption-1 text-text-muted">
                  Unused credits carry over to the next month. They never expire
                  as long as you have an active subscription.
                </p>
              </div>

              <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                <h4 className="text-callout font-semibold text-text-main mb-3">
                  Is there a free trial?
                </h4>
                <p className="text-caption-1 text-text-muted">
                  Yes! Every new user gets $3 in free credits to try our
                  platform. No credit card required.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-lg">
              <h3 className="text-title-2 font-semibold text-text-main mb-4 tracking-tight">
                Ready to Start Creating?
              </h3>
              <p className="text-body text-text-muted mb-6 max-w-2xl mx-auto">
                Join thousands of creators using our AI platform to bring their
                ideas to life
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/sign-up" className="btn btn-primary btn-lg">
                  Get Started Free
                </Link>
                <Link href="/dashboard" className="btn btn-ghost btn-lg">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
