import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove Turbopack config as it's not needed for production
  experimental: {
    // Keep only essential experimental features
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
    ignoreBuildErrors: false, // Keep type checking enabled
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
        ],
      },
    ];
  },

  // Vercel specific optimizations
  swcMinify: true,
  poweredByHeader: false,
};

export default nextConfig;
