import "server-only";

import { prisma } from "@ecosystem/database";

/**
 * Persist a partial settings update to the SiteConfig table.
 * Used by manager's `/api/admin/settings` PUT endpoint.
 */
export async function upsertSettings(
  updates: Record<string, unknown>,
): Promise<void> {
  const ops = Object.entries(updates)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      return prisma.siteConfig.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue },
      });
    });
  await Promise.all(ops);
}

/**
 * Read raw settings as a flat Record (for API response).
 * Returns a partial map; combine with defaults in the caller.
 */
export async function readRawSettings(): Promise<Record<string, unknown>> {
  const rows = await prisma.siteConfig.findMany();
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    try {
      out[r.key] = JSON.parse(r.value);
    } catch {
      out[r.key] = r.value;
    }
  }
  return out;
}
