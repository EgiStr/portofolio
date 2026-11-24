import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * POST /api/revalidate, called by the manager after a CV save (same shared
 * REVALIDATE_SECRET as the other apps). Every page here renders a CV, so the
 * whole app is refreshed whatever tags are sent.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  revalidatePath("/", "layout");
  return Response.json({ revalidated: true });
}
