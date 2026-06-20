import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";
import { verifyUnsubscribeToken } from "@/lib/newsletter-tokens";
import { getSettings } from "@ecosystem/config";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eggisatria.dev";

/**
 * GET /api/newsletter/unsubscribe?email=&token=
 *
 * One-click unsubscribe from email links. Always returns a friendly HTML
 * confirmation page (even on errors) so the user never sees a raw 4xx.
 *
 * The token is an HMAC of the email — we don't need to look anything up
 * before deciding whether to trust the request, but we still verify the
 * subscriber exists before "unsubscribing" (no-op otherwise).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  const token = searchParams.get("token") || "";

  if (!email || !token) {
    return await renderPage(
      "Missing parameters",
      "The unsubscribe link is incomplete.",
      false,
    );
  }

  if (!verifyUnsubscribeToken(email, token)) {
    return await renderPage(
      "Invalid link",
      "This unsubscribe link is invalid or has expired.",
      false,
      400,
    );
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      return await renderPage(
        "Already unsubscribed",
        "We couldn't find this email in our list — you may already be unsubscribed.",
        true,
      );
    }

    if (!subscriber.unsubscribedAt) {
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { unsubscribedAt: new Date() },
      });
    }

    return await renderPage(
      "Unsubscribed",
      `You've been unsubscribed. Sorry to see you go — you can resubscribe anytime at ${SITE_URL}.`,
      true,
    );
  } catch (err) {
    console.error("[newsletter/unsubscribe] failed", err);
    return await renderPage(
      "Something went wrong",
      "We couldn't process your request right now. Please try again later.",
      false,
      500,
    );
  }
}

async function renderPage(
  title: string,
  body: string,
  success: boolean,
  status = 200,
): Promise<NextResponse> {
  const settings = await getSettings().catch(() => null);
  const siteName = settings?.name || "Eggi Satria";
  const color = success ? "#16a34a" : "#dc2626";
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — ${escapeHtml(siteName)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0b0b0c; color: #fafafa; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { max-width: 480px; width: 100%; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; text-align: center; }
    h1 { margin: 0 0 12px; font-size: 24px; color: ${color}; }
    p { margin: 0 0 16px; line-height: 1.6; color: #d4d4d8; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <main class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(body)}</p>
    <p><a href="${SITE_URL}">← Back to ${escapeHtml(siteName)}</a></p>
  </main>
</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
