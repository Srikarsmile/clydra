import Layout from "../components/Layout";
import Link from "next/link";

export default function Services() {
  return (
    <Layout>
      <div className="min-h-screen bg-bg-base">
        {/* Header */}
        <div className="bg-gradient-neo-wave text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-large-title font-semibold mb-4 tracking-tight">Our AI Services</h1>
              <p className="text-title-3 font-normal opacity-90 max-w-3xl mx-auto">
                Professional AI tools for creating stunning images and videos
              </p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Image Generation Service */}
            <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎨</span>
                </div>
                <h2 className="text-title-1 font-semibold text-text-main mb-2 tracking-tight">
                  AI Image Generation
                </h2>
                <p className="text-body text-text-muted">
                  Create stunning visuals from text descriptions
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-callout text-text-main">Ultra-high resolution outputs</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-callout text-text-main">Multiple artistic styles</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-callout text-text-main">Commercial usage rights</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-callout text-text-main">Lightning-fast generation</span>
                </div>
              </div>

              <div className="text-center border-t border-border/30 pt-6">
                <div className="text-title-3 font-semibold text-text-main mb-4">
                  Starting at $0.10/image
                </div>
                <Link href="/dashboard" className="btn btn-primary">
                  Start Creating Images
                </Link>
              </div>
            </div>

            {/* Video Generation Service */}
            <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎬</span>
                </div>
                <h2 className="text-title-1 font-semibold text-text-main mb-2 tracking-tight">
                  AI Video Creation
                </h2>
                <p className="text-body text-text-muted">
                  Generate professional videos from simple prompts
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-callout text-text-main">4K video quality</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-callout text-text-main">Custom durations (5s or 10s)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-callout text-text-main">Multiple formats</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-callout text-text-main">Cinematic effects</span>
                </div>
              </div>

              <div className="text-center border-t border-border/30 pt-6">
                <div className="text-title-3 font-semibold text-text-main mb-4">
                  Starting at $1.50/video
                </div>
                <Link href="/dashboard" className="btn btn-primary">
                  Start Creating Videos
                </Link>
              </div>
            </div>

          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-lg">
              <h3 className="text-title-2 font-semibold text-text-main mb-4 tracking-tight">
                Ready to Create?
              </h3>
              <p className="text-body text-text-muted mb-6 max-w-2xl mx-auto">
                Join thousands of creators using our AI platform to bring their ideas to life
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