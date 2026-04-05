import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" output creates a monolithic bundle that exceeds
  // Vercel's 300mb serverless function limit. Only use standalone for
  // self-hosted deployments (Docker/bare-metal), not Vercel.
  output: process.env.DEPLOY_TARGET === "standalone" ? "standalone" : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // External packages — don't bundle into serverless functions
  serverExternalPackages: ['z-ai-web-dev-sdk', 'sharp'],
};

export default nextConfig;
