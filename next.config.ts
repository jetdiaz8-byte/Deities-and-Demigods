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
  serverExternalPackages: ['z-ai-web-dev-sdk', 'sharp', 'ws'],
  // Fixed: removed swcMinify (unrecognized in Next.js 16 / Turbopack)
  // TDZ bug was caused by useEffect hooks referencing useState variables
  // declared later in the function body — Turbopack's ESM bundler
  // mishandled the initialization order. Fixed by reordering declarations.
};

export default nextConfig;
