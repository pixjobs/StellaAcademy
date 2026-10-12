import type { NextConfig } from "next";

/**
 * Sent with every response. The pages are static, so scripts cannot carry a
 * per-request nonce and inline scripts have to stay allowed; what the policy
 * does do is limit where scripts, pictures and connections may come from and
 * stop the site being framed. Google's hosts are there for Analytics only.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.nasa.gov https://*.google-analytics.com https://*.googletagmanager.com",
  "media-src 'self'",
  "font-src 'self' data:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  /**
   * Enable Next.js "standalone" output. This generates a minimal server in
   * `.next/standalone`, which your Dockerfile copies. Keeps prod images small.
   */
  output: "standalone",

  /** Allow local network IPs during development */
  allowedDevOrigins: ['192.168.50.190', 'localhost', '127.0.0.1'],

  /** Stricter runtime checks */
  reactStrictMode: true,

  images: {
    /** Remote pictures come from NASA only. */
    remotePatterns: [{ protocol: "https", hostname: "**.nasa.gov", pathname: "/**" }],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
