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

  // Build and compile optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Keep type checking enabled
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // @performance - Enable compression
  compress: true,

  // Image optimizations
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
  },

  // @performance - Bundle analyzer in development
  webpack: (config, { dev, isServer }) => {
    // Enable source maps in development
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    
    // Optimize chunks
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },

  // Security headers
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
          // @performance - Add caching headers for static assets
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Vercel specific optimizations
  poweredByHeader: false,
};

export default nextConfig;
