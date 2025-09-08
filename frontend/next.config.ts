import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * A list of trusted remote domains for the next/image component.
     * This is a security measure to prevent image abuse from arbitrary sources.
     */
    remotePatterns: [
      // This single "wildcard" pattern is the most robust solution.
      // It will automatically allow images from any NASA domain, such as:
      // - epic.gsfc.nasa.gov (which caused your error)
      // - mars.nasa.gov
      // - images-assets.nasa.gov
      // - apod.nasa.gov
      // - and any others you might encounter.
      {
        protocol: 'https',
        hostname: '**.nasa.gov',
      },
    ],
  },
  /* ... you can add other config options here if needed */
};

export default nextConfig;