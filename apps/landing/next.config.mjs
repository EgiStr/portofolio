/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ecosystem/ui", "@ecosystem/database"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
