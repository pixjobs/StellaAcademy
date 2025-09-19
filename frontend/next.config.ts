import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Enable Next.js "standalone" output. This generates a minimal server in
   * `.next/standalone`, which your Dockerfile copies. Keeps prod images small.
   */
  output: "standalone",

  /** Stricter runtime checks */
  reactStrictMode: true,

  images: {
    /**
     * Security: restrict remote images to trusted domains only.
     * Use pathname: "/**" to explicitly allow all subpaths.
     */
    remotePatterns: [
      { protocol: "https", hostname: "**.nasa.gov", pathname: "/**" },
      { protocol: "https", hostname: "icons.duckduckgo.com", pathname: "/**" },
    ],
  },

  experimental: {
    /** Tree-shake imports from heavy packages you actually use */
    optimizePackageImports: ["lodash", "date-fns"],
  },

  /**
   * Exclude specific server-side packages from the Next.js bundle.
   * (Moved out of `experimental` in Next 15)
   */
  serverExternalPackages: ["@google-cloud/tasks", "@google-cloud/firestore"],
};

export default nextConfig;
