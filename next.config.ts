import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (updated for Next.js 15)
  turbopack: {
    rules: {
      // Add custom rules if needed
    },
    resolveAlias: {
      // Add custom aliases if needed
    },
  },

  // Experimental features - simplified to avoid issues
  experimental: {
    // Remove problematic optimizeCss for now
    optimizePackageImports: [
      "lucide-react",
      "@clerk/nextjs",
      "@supabase/supabase-js",
    ],
  },

  // Build and compile optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

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

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Remove problematic output setting for now
  poweredByHeader: false,

  // Headers for better performance
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
        ],
      },
    ];
  },
};

export default nextConfig;
