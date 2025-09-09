import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Enable Next.js "standalone" output. This generates a minimal server in
   * `.next/standalone`, which your Dockerfile copies. Keeps prod images small.
   */
  output: "standalone",

  /**
   * Opt into stricter runtime checks & SWC minification.
   */
  reactStrictMode: true,
  swcMinify: true,

  images: {
    /**
     * Security: restrict remote images to trusted domains only.
     * Use pathname: "/**" to explicitly allow all subpaths.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.nasa.gov",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "icons.duckduckgo.com",
        pathname: "/**",
      },
    ],
  },

  experimental: {
    /**
     * Tree-shake imports from heavy packages like lodash, date-fns, etc.
     * Replace with the packages you actually use.
     */
    optimizePackageImports: ["lodash", "date-fns"],
  },
};

export default nextConfig;
