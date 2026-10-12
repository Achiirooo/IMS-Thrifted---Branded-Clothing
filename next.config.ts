import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep classic (non-Cache-Components) rendering: auth pages read cookies
  // and must render per request, and redirect() then returns real HTTP
  // redirects, which is simpler for this school project.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
