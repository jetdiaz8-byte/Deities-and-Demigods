import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" output creates a monolithic bundle (~324mb) that exceeds
  // Vercel's 300mb serverless function limit. Only use standalone for
  // self-hosted deployments (Docker/bare-metal), not Vercel.
  output: process.env.DEPLOY_TARGET === "standalone" ? "standalone" : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ['z-ai-web-dev-sdk'],
};

export default nextConfig;
