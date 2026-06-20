import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";
import { getSettings } from "@ecosystem/config";
import { apiError, apiSuccess } from "@/lib/api-response";
import { buildContactNotificationEmail, sendEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  source?: unknown;
}

const MAX_NAME = 100;
const MAX_EMAIL = 200;
const MAX_MESSAGE = 2000;

/**
 * POST /api/contact — receive a contact form submission.
 *
 * Stores the submission in the database (always), then attempts to send a
 * notification email to the site owner (best-effort, never blocks the response).
 *
 * Rate-limited per IP: 5 submissions per 10 minutes.
 */
export async function POST(request: NextRequest) {
  // ---- Rate limit --------------------------------------------------------
  const ip = getClientIp(request);
  const limit = rateLimit(`contact:${ip}`, {
    windowMs: 10 * 60 * 1000, // 10 min
    max: 5,
  });

  if (!limit.allowed) {
    return apiError(
      `Too many submissions. Try again in ${Math.ceil(
        (limit.resetAt - Date.now()) / 1000,
      )}s.`,
      429,
    );
  }

  // ---- Parse + validate --------------------------------------------------
  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return apiError("Invalid JSON body.", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const source =
    typeof body.source === "string" && body.source.trim().length > 0
      ? body.source.trim().slice(0, 50)
      : "landing";

  const errors: string[] = [];
  if (!name || name.length < 2) errors.push("Name is required (min 2 chars).");
  if (name.length > MAX_NAME)
    errors.push(`Name must be under ${MAX_NAME} chars.`);
  if (!email) errors.push("Email is required.");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push("Email is not valid.");
  if (email.length > MAX_EMAIL)
    errors.push(`Email must be under ${MAX_EMAIL} chars.`);
  if (!message || message.length < 10)
    errors.push("Message is required (min 10 chars).");
  if (message.length > MAX_MESSAGE)
    errors.push(`Message must be under ${MAX_MESSAGE} chars.`);

  if (errors.length > 0) {
    return apiError(errors.join(" "), 400);
  }

  const userAgent = request.headers.get("user-agent");

  // ---- Persist -----------------------------------------------------------
  let submission;
  try {
    submission = await prisma.contactSubmission.create({
      data: {
        name,
        email,
        message,
        source,
        ipAddress: ip !== "unknown" ? ip : null,
        userAgent,
      },
    });
  } catch (err) {
    console.error("[contact] db insert failed", err);
    return apiError("Failed to save submission. Please try again.", 500);
  }

  // ---- Email notification (best-effort, do not block response) -----------
  // We resolve this promise later; the response returns immediately so the
  // user gets a fast "sent!" confirmation even if Resend is slow.
  void sendNotificationEmail(submission.id, { name, email, message, source });

  return apiSuccess(
    {
      id: submission.id,
      message:
        "Thanks! Your message has been received — I'll get back to you soon.",
    },
    201,
  );
}

async function sendNotificationEmail(
  submissionId: string,
  input: { name: string; email: string; message: string; source: string },
) {
  try {
    const settings = await getSettings();
    const notifyTo = settings.email || process.env.CONTACT_NOTIFY_TO;
    if (!notifyTo) {
      console.warn(
        "[contact] no notification email configured (settings.email or CONTACT_NOTIFY_TO)",
      );
      return;
    }

    const { html, text, subject } = buildContactNotificationEmail({
      ...input,
      submittedAt: new Date(),
      submissionId,
    });

    const result = await sendEmail({
      to: notifyTo,
      subject,
      html,
      text,
      replyTo: input.email,
    });

    if (!result.success) {
      console.error("[contact] notification email failed", result.error);
    } else if (result.simulated) {
      console.log(
        `[contact] notification simulated for submission ${submissionId}`,
      );
    }
  } catch (err) {
    // Never let email failures bubble up — submission is already saved.
    console.error("[contact] notification email exception", err);
  }
}
