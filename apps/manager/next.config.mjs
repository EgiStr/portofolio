import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@ecosystem/ui",
    "@ecosystem/database",
    "@ecosystem/config",
    "@ecosystem/cv-core",
  ],
  serverExternalPackages: [],
  // Document uploads go through a server action; Vercel caps a request at 4.5 MB.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config) => {
    config.plugins.push(new PrismaPlugin());
    return config;
  },
};

export default nextConfig;
