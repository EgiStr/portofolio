import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/revalidate
 *
 * Cross-app cache invalidation endpoint. Manager calls this to invalidate
 * the `site-settings` tag on this app after a settings write, so the next
 * `getSettings()` call returns the updated values.
 *
 * Auth: shared `REVALIDATE_SECRET` sent in the `x-revalidate-secret` header.
 * Body: `{ tags: string[] }` — list of tags to invalidate.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-revalidate-secret");
  if (auth !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let tags: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.tags)) {
      tags = body.tags.filter(
        (t: unknown): t is string => typeof t === "string",
      );
    }
  } catch {
    // Body was missing or not JSON — treat as empty list.
  }

  tags.forEach((t) => revalidateTag(t));

  return NextResponse.json({ revalidated: true, tags });
}
