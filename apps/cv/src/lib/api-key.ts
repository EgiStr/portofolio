import { createHash } from "node:crypto";
import { prisma } from "@ecosystem/database";

/**
 * Bearer keys are the manager's existing API keys (eds_api_keys, SHA-256 hash
 * stored). Only keys whose label starts with "cv" or "zia" are accepted here, so a
 * backup key cannot edit the CV.
 */
export async function authenticate(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  // Local testing only: `next dev` accepts CV_MCP_DEV_TOKEN from .env.local. Production never does.
  const dev = process.env.CV_MCP_DEV_TOKEN;
  if (
    process.env.NODE_ENV === "development" &&
    dev &&
    dev.length >= 24 &&
    token === dev
  ) {
    return { id: "dev", name: "cv dev" };
  }
  const keyHash = createHash("sha256").update(token).digest("hex");
  const key = await prisma.apiKey.findFirst({
    where: { keyHash, isActive: true },
  });
  if (!key || !/^(cv|zia)\b/i.test(key.name)) return null;
  prisma.apiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});
  return key;
}
