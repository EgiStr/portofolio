import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@ecosystem/database";
import { SettingsSchema, type Settings } from "./schema";
import { defaultSettings } from "./defaults";

/**
 * Server-side read of all site settings.
 * Cached with tag `site-settings` so we can invalidate via revalidateTag().
 *
 * @example
 * ```ts
 * // In a Server Component
 * const settings = await getSettings();
 * return <h1>{settings.heroTitle}</h1>;
 * ```
 */
export const getSettings = unstable_cache(
  async (): Promise<Settings> => {
    try {
      const rows = await prisma.siteConfig.findMany();
      const stored: Record<string, unknown> = {};
      for (const r of rows) {
        try {
          stored[r.key] = JSON.parse(r.value);
        } catch {
          stored[r.key] = r.value;
        }
      }
      // Merge stored values onto defaults, then validate with Zod
      return SettingsSchema.parse({ ...defaultSettings, ...stored });
    } catch (err) {
      console.error("[getSettings] failed, falling back to defaults", err);
      return SettingsSchema.parse(defaultSettings);
    }
  },
  ["site-settings"],
  {
    tags: ["site-settings"],
    revalidate: 60, // seconds — fallback in case fanout misses
  },
);
