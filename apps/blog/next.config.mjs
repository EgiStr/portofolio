import createMDX from "@next/mdx";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@ecosystem/ui",
    "@ecosystem/database",
    "@ecosystem/config",
  ],
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Keep Prisma external — Next.js 15 handles this natively via serverExternalPackages
  // DO NOT use @prisma/nextjs-monorepo-workaround-plugin — it conflicts with Next.js 15
  serverExternalPackages: ["@prisma/client"],
  // Trace from monorepo root so engine binaries in root node_modules are included
  outputFileTracingRoot: join(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/": [join(__dirname, "../../node_modules/.prisma/client/**")],
    "/blog/**": [join(__dirname, "../../node_modules/.prisma/client/**")],
    "/api/**": [join(__dirname, "../../node_modules/.prisma/client/**")],
    "/sitemap.xml": [join(__dirname, "../../node_modules/.prisma/client/**")],
    "/rss.xml": [join(__dirname, "../../node_modules/.prisma/client/**")],
  },
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self' data: https://fonts.gstatic.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
    `
      .replace(/\s{2,}/g, " ")
      .trim();

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
  },
});

export default withMDX(nextConfig);
