import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Source images are large PNGs; Next serves resized AVIF/WebP on demand.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
