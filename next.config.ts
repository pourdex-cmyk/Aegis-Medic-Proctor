import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "www.gravatar.com" },
    ],
  },

  async redirects() {
    return [
      { source: "/app", destination: "/app/dashboard", permanent: false },
    ]
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
}

export default nextConfig
