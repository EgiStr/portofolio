import { createHmac, timingSafeEqual } from "crypto";

/**
 * Unsubscribe token utilities.
 *
 * Tokens are deterministic HMAC-SHA256 of the subscriber's email so we never
 * have to store them. To unsubscribe, the client supplies the email + token;
 * we recompute the token and compare in constant time.
 *
 * Tokens are tied to a server-side secret. Rotate by changing
 * NEWSLETTER_SECRET (or its fallback NEXTAUTH_SECRET) — old links then
 * invalidate gracefully without DB migration.
 */

function getSecret(): string {
  return (
    process.env.NEWSLETTER_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "fallback-dev-secret-rotate-me"
  );
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export function signUnsubscribeToken(email: string): string {
  return createHmac("sha256", getSecret())
    .update(normalize(email))
    .digest("hex");
}

export function verifyUnsubscribeToken(
  email: string,
  token: string | null | undefined,
): boolean {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const expected = signUnsubscribeToken(email);
  // timingSafeEqual requires equal-length buffers; both are 64 hex chars.
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(token, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
