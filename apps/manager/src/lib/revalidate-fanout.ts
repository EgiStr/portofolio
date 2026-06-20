/**
 * Cross-app cache invalidation fanout.
 *
 * Called by `apps/manager/src/app/api/admin/settings/route.ts` after every
 * successful settings write. Posts to each consumer app's `/api/revalidate`
 * endpoint so its `site-settings` cache tag is invalidated and the next
 * `getSettings()` call returns fresh data.
 *
 * Uses `Promise.allSettled` so a single unreachable target never blocks
 * the other fanouts. Each consumer app validates the shared
 * `REVALIDATE_SECRET` header.
 */

type FanoutResult = {
  target: string;
  ok: boolean;
  status?: number;
  error?: string;
};

function resolveTargets(): string[] {
  const candidates = [
    process.env.NEXT_PUBLIC_LANDING_URL,
    process.env.NEXT_PUBLIC_BLOG_URL,
    process.env.NEXT_PUBLIC_EDS_URL,
    process.env.NEXT_PUBLIC_HUB_URL,
  ];
  return candidates.filter((u): u is string => Boolean(u));
}

export async function fanoutRevalidate(
  tags: string[],
): Promise<FanoutResult[]> {
  const targets = resolveTargets();
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    console.warn(
      "[revalidate-fanout] REVALIDATE_SECRET is not set; skipping fanout.",
    );
    return targets.map((target) => ({
      target,
      ok: false,
      error: "REVALIDATE_SECRET not set",
    }));
  }

  const results = await Promise.allSettled(
    targets.map(async (base): Promise<FanoutResult> => {
      const url = `${base.replace(/\/+$/, "")}/api/revalidate`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-revalidate-secret": secret,
          },
          body: JSON.stringify({ tags }),
          // Disable Next.js fetch caching - we want the request to fire now.
          cache: "no-store",
        });
        if (!res.ok) {
          return {
            target: base,
            ok: false,
            status: res.status,
            error: `HTTP ${res.status}`,
          };
        }
        return { target: base, ok: true, status: res.status };
      } catch (err) {
        return {
          target: base,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );

  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : {
          target: targets[i],
          ok: false,
          error:
            r.reason instanceof Error ? r.reason.message : String(r.reason),
        },
  );
}
