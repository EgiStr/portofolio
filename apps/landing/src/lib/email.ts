/**
 * Email infrastructure with Resend integration.
 *
 * If RESEND_API_KEY is set, sends via Resend's HTTP API (no SDK needed).
 * If not set, logs the email to console and returns success — useful for
 * local development and CI where you don't want to actually send mail.
 *
 * All sends (real or simulated) are persisted to the database by the caller,
 * so nothing is lost when running in console-fallback mode.
 */

interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  /** True when RESEND_API_KEY is not configured — emails are logged instead. */
  simulated: boolean;
}

const DEFAULT_FROM = process.env.CONTACT_EMAIL_FROM || "noreply@eggisatria.dev";

/**
 * Send an email via Resend, or log it to the console if no API key is set.
 *
 * Resend API: POST https://api.resend.com/emails
 *   Headers: Authorization: Bearer <RESEND_API_KEY>
 *   Body:    { from, to, subject, html, text, reply_to }
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const from = options.from || DEFAULT_FROM;
  const to = Array.isArray(options.to) ? options.to : [options.to];
  const apiKey = process.env.RESEND_API_KEY;

  // Fallback: no API key — log and pretend it worked.
  if (!apiKey) {
    console.log("[email:simulated]", {
      from,
      to,
      subject: options.subject,
      replyTo: options.replyTo,
      textPreview: options.text?.slice(0, 200) ?? options.html.slice(0, 200),
    });
    return {
      success: true,
      simulated: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email:resend] failed", res.status, body);
      return {
        success: false,
        simulated: false,
        error: `Resend returned ${res.status}: ${body}`,
      };
    }

    const data = (await res.json()) as { id?: string };
    return {
      success: true,
      simulated: false,
      messageId: data.id,
    };
  } catch (err) {
    console.error("[email:resend] exception", err);
    return {
      success: false,
      simulated: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Build the HTML for a contact-form notification email.
 * Sent to the site owner when someone submits the contact form.
 */
export function buildContactNotificationEmail(input: {
  name: string;
  email: string;
  message: string;
  source?: string | null;
  submittedAt: Date;
  submissionId: string;
}): { html: string; text: string; subject: string } {
  const { name, email, message, source, submittedAt, submissionId } = input;
  const subject = `[Contact] ${name} — ${new URL("mailto:" + email).pathname}`;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const safeSource = source ? escapeHtml(source) : "unknown";
  const submitted = submittedAt.toISOString();

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #111;">New contact form submission</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 6px 0; color: #555; width: 100px;"><strong>From</strong></td><td style="padding: 6px 0;">${safeName} &lt;${safeEmail}&gt;</td></tr>
        <tr><td style="padding: 6px 0; color: #555;"><strong>Source</strong></td><td style="padding: 6px 0;">${safeSource}</td></tr>
        <tr><td style="padding: 6px 0; color: #555;"><strong>When</strong></td><td style="padding: 6px 0;">${submitted}</td></tr>
        <tr><td style="padding: 6px 0; color: #555;"><strong>ID</strong></td><td style="padding: 6px 0; font-family: monospace; font-size: 12px;">${submissionId}</td></tr>
      </table>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
      <div style="white-space: pre-wrap; line-height: 1.5; color: #222;">${safeMessage}</div>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0 8px;" />
      <p style="color: #888; font-size: 12px; margin: 0;">
        Reply directly to this email to respond to ${safeName}.
      </p>
    </div>
  `.trim();

  const text = [
    `New contact form submission`,
    ``,
    `From:    ${name} <${email}>`,
    `Source:  ${source ?? "unknown"}`,
    `When:    ${submitted}`,
    `ID:      ${submissionId}`,
    ``,
    `---`,
    ``,
    message,
    ``,
    `---`,
    `Reply directly to this email to respond to ${name}.`,
  ].join("\n");

  return { html, text, subject };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
