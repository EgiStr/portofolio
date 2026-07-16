/**
 * Postbuild script: copies Prisma engine binaries into .next/server/ so
 * they're available at runtime in Vercel serverless functions.
 *
 * The monorepo root has the binaries at:
 *   <root>/node_modules/.prisma/client/
 *
 * Next.js serverless expects them at:
 *   .next/server/node_modules/.prisma/client/
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const src = join(__dirname, "../../../node_modules/.prisma/client");
const dst = join(__dirname, "../.next/server/node_modules/.prisma/client");

if (!existsSync(src)) {
  console.warn("[copy-prisma-engine] Source not found, skipping:", src);
  process.exit(0);
}

mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true });
console.log("[copy-prisma-engine] Copied Prisma engine to", dst);
