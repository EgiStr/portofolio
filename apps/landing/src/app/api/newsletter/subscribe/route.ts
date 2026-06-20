import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";
import { apiError, apiSuccess } from "@/lib/api-response";
import { sendEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { signUnsubscribeToken } from "@/lib/newsletter-tokens";
import { getSettings } from "@ecosystem/config";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

interface SubscribePayload {
  email?: unknown;
  name?: unknown;
  source?: unknown;
}

const MAX_EMAIL = 200;
const MAX_NAME = 100;

/**
 * POST /api/newsletter/subscribe — single opt-in newsletter signup.
 *
 * Behavior:
 *   - Idempotent: re-subscribing an already-active address returns success
 *     without sending another email.
 *   - Re-subscribing an unsubscribed address re-activates it (clears
 *     unsubscribedAt).
 *   - Sends a welcome email with an unsubscribe link. Email is best-effort:
 *     the subscriber is still saved if the send fails.
 *
 * Rate-limited per IP: 5 attempts per 10 minutes.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`newsletter:${ip}`, {
    windowMs: 10 * 60 * 1000,
    max: 5,
  });

  if (!limit.allowed) {
    return apiError(
      `Too many attempts. Try again in ${Math.ceil(
        (limit.resetAt - Date.now()) / 1000,
      )}s.`,
      429,
    );
  }

  let body: SubscribePayload;
  try {
    body = (await request.json()) as SubscribePayload;
  } catch {
    return apiError("Invalid JSON body.", 400);
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name =
    typeof body.name === "string" ? body.name.trim().slice(0, MAX_NAME) : "";
  const source =
    typeof body.source === "string" && body.source.trim().length > 0
      ? body.source.trim().slice(0, 50)
      : "landing";

  if (!email) return apiError("Email is required.", 400);
  if (email.length > MAX_EMAIL)
    return apiError(`Email must be under ${MAX_EMAIL} chars.`, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return apiError("Email is not valid.", 400);

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing && !existing.unsubscribedAt) {
      // Already an active subscriber — no-op success.
      return apiSuccess({
        alreadySubscribed: true,
        message: "You're already on the list — thanks!",
      });
    }

    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: {
        email,
        name: name || null,
        source,
        confirmedAt: new Date(), // single opt-in for v1
      },
      update: {
        // Reactivate.
        name: name || existing?.name || null,
        source,
        unsubscribedAt: null,
        confirmedAt: existing?.confirmedAt ?? new Date(),
      },
    });

    // Fire-and-forget welcome email; never block the response on it.
    void sendWelcomeEmail(subscriber.email, subscriber.name);

    return apiSuccess(
      {
        alreadySubscribed: false,
        message: "Subscribed! Check your inbox for a welcome email.",
      },
      201,
    );
  } catch (err) {
    console.error("[newsletter/subscribe] failed", err);
    return apiError("Failed to subscribe. Please try again.", 500);
  }
}

async function sendWelcomeEmail(email: string, name: string | null) {
  try {
    const settings = await getSettings();
    const fromName = settings.name || "Eggi Satria";
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://eggisatria.dev";
    const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(
      email,
    )}&token=${signUnsubscribeToken(email)}`;

    const displayName = name || "there";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px; color: #111;">Welcome aboard!</h2>
        <p style="line-height: 1.6; color: #222;">Hi ${escapeHtml(displayName)},</p>
        <p style="line-height: 1.6; color: #222;">
          Thanks for subscribing to updates from ${escapeHtml(fromName)}. You'll get an email when there's a new blog post or notable project — nothing else.
        </p>
        <p style="line-height: 1.6; color: #222;">
          In the meantime, feel free to check out the
          <a href="${siteUrl}" style="color: #2563eb;">latest posts</a>.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px; margin: 0;">
          You're receiving this because you signed up at ${siteUrl}.<br />
          <a href="${unsubscribeUrl}" style="color: #888;">Unsubscribe</a> any time.
        </p>
      </div>
    `.trim();

    const text = [
      `Welcome aboard!`,
      ``,
      `Hi ${displayName},`,
      ``,
      `Thanks for subscribing to updates from ${fromName}. You'll get an email when there's a new blog post or notable project — nothing else.`,
      ``,
      `In the meantime, check out ${siteUrl}.`,
      ``,
      `---`,
      `You're receiving this because you signed up at ${siteUrl}.`,
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join("\n");

    const result = await sendEmail({
      to: email,
      subject: `Welcome — you're subscribed to ${fromName}`,
      html,
      text,
    });

    if (!result.success) {
      console.error(
        "[newsletter/subscribe] welcome email failed",
        result.error,
      );
    }
  } catch (err) {
    console.error("[newsletter/subscribe] welcome email exception", err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
