import { createHash } from "node:crypto";
import { prisma } from "@ecosystem/database";

/**
 * Bearer keys are the manager's API keys (eds_api_keys, SHA-256 hash stored).
 * Only keys labelled "zia..." or "manager..." may use the manager MCP, so a
 * backup or CV key cannot edit site content.
 */
export async function authenticateMcp(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  // Local testing only: `next dev` accepts MANAGER_MCP_DEV_TOKEN from .env.local. Production never does.
  const dev = process.env.MANAGER_MCP_DEV_TOKEN;
  if (
    process.env.NODE_ENV === "development" &&
    dev &&
    dev.length >= 24 &&
    token === dev
  ) {
    return { id: "dev", name: "manager dev" };
  }
  const keyHash = createHash("sha256").update(token).digest("hex");
  const key = await prisma.apiKey.findFirst({
    where: { keyHash, isActive: true },
  });
  if (!key || !/^(zia|manager)\b/i.test(key.name)) return null;
  prisma.apiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});
  return key;
}
