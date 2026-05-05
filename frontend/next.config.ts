import type { NextConfig } from "next";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.201"],

  turbopack: {
    resolveAlias: {
      "tw-animate-css": "./node_modules/tw-animate-css/dist/tw-animate.css",
      "shadcn/tailwind.css": "./node_modules/shadcn/dist/tailwind.css",
    },
  },

  // Proxy all /api/v1/* requests to the FastAPI backend.
  // Browser code can use relative /api/v1/... with no CORS issues.
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
