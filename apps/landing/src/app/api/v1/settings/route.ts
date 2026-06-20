import { NextRequest } from "next/server";
import { prisma } from "@ecosystem/database";
import { withApiKey } from "@/lib/middleware/with-api-key";
import { apiSuccess, apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

/**
 * GET /api/v1/settings — authenticated snapshot of public site settings.
 * Requires an API key in the `x-api-key` header.
 *
 * Returns the same `site_configs` rows the landing page consumes via
 * `@ecosystem/config`, so external clients (mobile apps, dashboards, etc.)
 * can render the site without scraping.
 */
export const GET = withApiKey(async (_request: NextRequest) => {
  try {
    const rows = await prisma.siteConfig.findMany({
      orderBy: { key: "asc" },
    });

    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return apiSuccess({
      count: rows.length,
      settings,
      updatedAt: rows.reduce<Date | null>((latest, row) => {
        const ts = row.updatedAt;
        if (!latest || ts > latest) return ts;
        return latest;
      }, null),
    });
  } catch (err) {
    console.error("[api/v1/settings] failed", err);
    return apiError(
      err instanceof Error ? err.message : "Failed to fetch settings",
      500,
    );
  }
});

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}
