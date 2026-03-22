import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Server-only env vars available to server components / API routes
  serverRuntimeConfig: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },

  // Public env vars available everywhere (including client)
  publicRuntimeConfig: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },

  // Image domains allowed for next/image
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Allow Gravatar / avatar providers
      { protocol: "https", hostname: "www.gravatar.com" },
    ],
  },

  // Redirect bare /app to dashboard
  async redirects() {
    return [
      { source: "/app", destination: "/app/dashboard", permanent: false },
    ]
  },

  // Experimental features
  experimental: {
    // Optimize package imports for large icon libraries
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
}

export default nextConfig
