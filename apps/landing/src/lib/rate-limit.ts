/**
 * Naive in-memory rate limiter for unauthenticated endpoints (contact form,
 * newsletter subscribe). Resets on process restart — fine for serverless
 * single-instance deployments and for the volume we're protecting against
 * (bots, not coordinated DDoS).
 *
 * For higher-traffic scenarios, swap this for Upstash Redis or Vercel KV.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  /** Window size in milliseconds. */
  windowMs: number;
  /** Max requests per window. */
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  opts: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const entry = buckets.get(key);

  // No entry, or window expired — start fresh.
  if (!entry || entry.resetAt <= now) {
    const fresh: RateLimitEntry = {
      count: 1,
      resetAt: now + opts.windowMs,
    };
    buckets.set(key, fresh);
    return { allowed: true, remaining: opts.max - 1, resetAt: fresh.resetAt };
  }

  // Window still active.
  if (entry.count >= opts.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: opts.max - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Extract a best-effort client IP from common request headers.
 * Falls back to "unknown" if nothing is available.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
