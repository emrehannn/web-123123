import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Dev-only: let the dev server answer HMR requests that arrive over 127.0.0.1
     instead of localhost; otherwise Next blocks them and edits never reach the page. */
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [480, 640, 768, 1024, 1280, 1440, 1920, 2560, 3840],
    qualities: [100],
    minimumCacheTTL: 31536000,
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
      ],
    },
    {
      source: "/images/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
};

export default nextConfig;
