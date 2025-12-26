import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
};

export default nextConfig;
