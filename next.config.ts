import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep DB drivers out of the client/edge bundles.
  serverExternalPackages: ["postgres", "@neondatabase/serverless"],
  experimental: {
    // Server Actions are used for case management persistence.
  },
};

export default nextConfig;
