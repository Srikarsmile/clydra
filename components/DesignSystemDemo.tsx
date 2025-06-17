import React from "react";

const DesignSystemDemo: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 animate-fade-in-up">
        <h1 className="text-large-title font-semibold text-gradient-neo-wave">
          Neo-Wave Tech Design System
        </h1>
        <p className="text-body text-text-muted max-w-2xl mx-auto">
          A clean, contemporary design system that blends ocean-inspired blues
          and greens with bright orange accents, featuring Apple-inspired
          typography and fluid animations.
        </p>
      </div>

      {/* Typography Section */}
      <section className="space-y-8 animate-fade-in-up animation-delay-200">
        <h2 className="text-title-1 font-semibold text-text-main">
          Typography Scale
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6 space-y-4">
            <h3 className="text-title-2 font-semibold text-text-main">
              Apple HIG Typography
            </h3>
            <div className="space-y-3">
              <div className="text-large-title">Large Title (34px)</div>
              <div className="text-title-1">Title 1 (28px)</div>
              <div className="text-title-2">Title 2 (22px)</div>
              <div className="text-title-3">Title 3 (20px)</div>
              <div className="text-headline">Headline (17px, Semibold)</div>
              <div className="text-body">Body (17px, Regular)</div>
              <div className="text-callout">Callout (16px)</div>
              <div className="text-subhead">Subhead (15px)</div>
              <div className="text-footnote">Footnote (13px)</div>
              <div className="text-caption-1">Caption 1 (12px)</div>
              <div className="text-caption-2">Caption 2 (11px)</div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-title-2 font-semibold text-text-main">
              Text Gradients
            </h3>
            <div className="space-y-4">
              <div className="text-title-1 text-gradient-neo-wave">
                Neo-Wave Gradient
              </div>
              <div className="text-title-1 text-gradient-ocean">
                Ocean Gradient
              </div>
              <p className="text-body text-text-muted">
                Gradients use our core color palette to create visual hierarchy
                and brand consistency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Color System */}
      <section className="space-y-8 animate-fade-in-up animation-delay-300">
        <h2 className="text-title-1 font-semibold text-text-main">
          Color System
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-title-3 font-semibold text-primary">
              Primary Colors
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-lg shadow-primary-glow"></div>
                <div>
                  <div className="text-callout font-medium">
                    Deep Ocean Blue
                  </div>
                  <div className="text-caption-1 text-text-muted">#003E5F</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary rounded-lg shadow-secondary-glow"></div>
                <div>
                  <div className="text-callout font-medium">Fresh Emerald</div>
                  <div className="text-caption-1 text-text-muted">#5BE7A9</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-accent rounded-lg shadow-accent-glow"></div>
                <div>
                  <div className="text-callout font-medium">Burnt Orange</div>
                  <div className="text-caption-1 text-text-muted">#FF6B35</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-title-3 font-semibold text-text-main">
              Surface Colors
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-bg-base border border-border rounded-lg"></div>
                <div>
                  <div className="text-callout font-medium">
                    Background Base
                  </div>
                  <div className="text-caption-1 text-text-muted">
                    Ice Gray / Charcoal
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-surface border border-border rounded-lg"></div>
                <div>
                  <div className="text-callout font-medium">Surface</div>
                  <div className="text-caption-1 text-text-muted">
                    White / Dark Gray
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-title-3 font-semibold text-text-main">
              Text Colors
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-text-main rounded-lg"></div>
                <div>
                  <div className="text-callout font-medium text-text-main">
                    Main Text
                  </div>
                  <div className="text-caption-1 text-text-muted">Adaptive</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-text-muted rounded-lg"></div>
                <div>
                  <div className="text-callout font-medium text-text-muted">
                    Muted Text
                  </div>
                  <div className="text-caption-1 text-text-muted">
                    Secondary
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Button System */}
      <section className="space-y-8 animate-fade-in-up animation-delay-400">
        <h2 className="text-title-1 font-semibold text-text-main">
          Button System
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6 space-y-6">
            <h3 className="text-title-3 font-semibold text-text-main">
              Button Variants
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button className="btn btn-primary">Primary Button</button>
                <button className="btn btn-secondary">Secondary Button</button>
                <button className="btn btn-accent">Accent Button</button>
                <button className="btn btn-ghost">Ghost Button</button>
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-6">
            <h3 className="text-title-3 font-semibold text-text-main">
              Button Sizes
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button className="btn btn-primary btn-xs">Extra Small</button>
                <button className="btn btn-primary btn-sm">Small</button>
                <button className="btn btn-primary btn-md">Medium</button>
                <button className="btn btn-primary btn-lg">Large</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Input System */}
      <section className="space-y-8 animate-fade-in-up animation-delay-500">
        <h2 className="text-title-1 font-semibold text-text-main">
          Input System
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6 space-y-6">
            <h3 className="text-title-3 font-semibold text-text-main">
              Input Fields
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Standard input field"
                className="input-field"
              />
              <input
                type="text"
                placeholder="Large input field"
                className="input-field input-large"
              />
              <input
                type="text"
                placeholder="Small input field"
                className="input-field input-small"
              />
            </div>
          </div>

          <div className="card p-6 space-y-6">
            <h3 className="text-title-3 font-semibold text-text-main">
              Badges
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <span className="badge badge-primary">Primary</span>
                <span className="badge badge-secondary">Secondary</span>
                <span className="badge badge-accent">Accent</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="status-dot status-online"></span>
                <span className="text-callout">Online</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card System */}
      <section className="space-y-8 animate-fade-in-up animation-delay-600">
        <h2 className="text-title-1 font-semibold text-text-main">
          Card System
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-title-3 font-semibold text-text-main">
              Standard Card
            </h3>
            <p className="text-body text-text-muted">
              Basic card with subtle shadows and rounded corners for fluid
              design.
            </p>
          </div>

          <div className="card card-interactive p-6 space-y-4">
            <h3 className="text-title-3 font-semibold text-text-main">
              Interactive Card
            </h3>
            <p className="text-body text-text-muted">
              Hover over this card to see the Neo-Wave glow animation effect.
            </p>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-title-3 font-semibold text-text-main">
              Glass Card
            </h3>
            <p className="text-body text-text-muted">
              Glass morphism effect with backdrop blur and transparency.
            </p>
          </div>
        </div>
      </section>

      {/* Animation System */}
      <section className="space-y-8 animate-fade-in-up animation-delay-700">
        <h2 className="text-title-1 font-semibold text-text-main">
          Animation System
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-6 space-y-4 animate-scale-in-spring">
            <h3 className="text-title-3 font-semibold text-text-main">
              Spring Scale
            </h3>
            <p className="text-body text-text-muted">
              Apple-inspired spring animation with smooth easing curves.
            </p>
          </div>

          <div className="card p-6 space-y-4 animate-slide-in-right">
            <h3 className="text-title-3 font-semibold text-text-main">
              Slide In
            </h3>
            <p className="text-body text-text-muted">
              Smooth slide-in animation with cubic-bezier timing.
            </p>
          </div>

          <div className="card p-6 space-y-4 animate-neo-wave-glow">
            <h3 className="text-title-3 font-semibold text-text-main">
              Neo-Wave Glow
            </h3>
            <p className="text-body text-text-muted">
              Signature glow effect using brand colors and smooth transitions.
            </p>
          </div>
        </div>
      </section>

      {/* Loading States */}
      <section className="space-y-8 animate-fade-in-up animation-delay-800">
        <h2 className="text-title-1 font-semibold text-text-main">
          Loading States
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-title-3 font-semibold text-text-main">
              Spinner
            </h3>
            <div className="flex items-center space-x-3">
              <div className="loading-spinner w-6 h-6"></div>
              <span className="text-body text-text-muted">Loading...</span>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-title-3 font-semibold text-text-main">
              Skeleton
            </h3>
            <div className="space-y-3">
              <div className="skeleton skeleton-text w-full"></div>
              <div className="skeleton skeleton-text w-3/4"></div>
              <div className="skeleton skeleton-text w-1/2"></div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-title-3 font-semibold text-text-main">
              Avatar Skeleton
            </h3>
            <div className="flex items-center space-x-3">
              <div className="skeleton skeleton-avatar"></div>
              <div className="space-y-2 flex-1">
                <div className="skeleton skeleton-text w-1/2"></div>
                <div className="skeleton skeleton-text w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Background Patterns */}
      <section className="space-y-8 animate-fade-in-up animation-delay-900">
        <h2 className="text-title-1 font-semibold text-text-main">
          Background Patterns
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card relative overflow-hidden p-6 space-y-4">
            <div className="absolute inset-0 bg-neo-wave-mesh opacity-20"></div>
            <div className="relative z-10">
              <h3 className="text-title-3 font-semibold text-text-main">
                Neo-Wave Mesh
              </h3>
              <p className="text-body text-text-muted">
                Subtle gradient mesh background using brand colors.
              </p>
            </div>
          </div>

          <div className="card relative overflow-hidden p-6 space-y-4">
            <div className="absolute inset-0 bg-fluid-grid opacity-30"></div>
            <div className="relative z-10">
              <h3 className="text-title-3 font-semibold text-text-main">
                Fluid Grid
              </h3>
              <p className="text-body text-text-muted">
                Geometric grid pattern with fluid, organic elements.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DesignSystemDemo;
