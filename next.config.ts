import type { NextConfig } from "next";

// TAURI_ENV varsa static export yap (desktop app için)
// Yoksa standalone mode (web deployment için - API routes + Docker)
const isTauri = process.env.TAURI_ENV === "true";

const nextConfig: NextConfig = {
  // Tauri: static export, Web: standalone (for Docker)
  output: isTauri ? "export" : "standalone",
  ...(isTauri ? { distDir: "out" } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-7c0a7463d6c24d1bafdec3a1e227ec2c.r2.dev',
        pathname: '/**',
      },
    ],
  },
  // Tauri için gerekli
  assetPrefix: isTauri ? "" : undefined,
};

export default nextConfig;
