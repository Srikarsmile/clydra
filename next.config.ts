import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @performance - Enable experimental optimizations
  experimental: {
    // Optimize package imports for better tree shaking
    optimizePackageImports: [
      "lucide-react",
      "@clerk/nextjs",
      "@supabase/supabase-js",
      "react-markdown",
      "remark-gfm",
    ],
  },

  // @performance - Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Build and compile optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Keep type checking enabled
  },

  // @performance - Image optimizations
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    // @performance - Optimize image loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // @performance - Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
    // @performance - Enable SWC minification
    styledComponents: false,
  },

  // @performance - Enable compression
  compress: true,

  // @performance - Output optimization
  output: "standalone",

  // @performance - Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // @performance - Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // @performance - Optimize for production
    if (!dev) {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },

  // @security - Enhanced security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.com https://clerk.dev https://*.clerk.dev; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openrouter.ai https://api.kluster.ai https://api.sarvam.ai https://clerk.com https://*.clerk.com https://clerk.dev https://*.clerk.dev https://*.supabase.co wss://*.supabase.co; frame-src 'self' https://clerk.com https://*.clerk.com https://clerk.dev https://*.clerk.dev;",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // @performance - Redirect optimization
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  // @performance - Vercel specific optimizations
  poweredByHeader: false,
  
  // @performance - Generate static pages where possible
  generateEtags: true,
  
  // @performance - Optimize dev server
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
