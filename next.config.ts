import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  experimental: {
    // Enable experimental features if needed
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  serverExternalPackages: ["pdf.js-extract"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/uploads/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  webpack: (config, { isServer }) => {
    // Exclude pdf.js-extract from client bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "pdf.js-extract": false,
      };
    }
    return config;
  },
};

export default nextConfig;
