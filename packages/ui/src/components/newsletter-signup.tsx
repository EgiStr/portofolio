"use client";

import * as React from "react";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";

export interface NewsletterSignupProps {
  /** API endpoint to POST { email, name?, source } to. */
  endpoint?: string;
  /** Free-form source label, e.g. "landing-footer" or "blog-sidebar". */
  source?: string;
  /** Optional heading text. */
  title?: string;
  /** Optional body text below the heading. */
  description?: string;
  /** Optional placeholder for the email input. */
  placeholder?: string;
  /** Optional button text. */
  buttonLabel?: string;
  /** Additional class names for the root container. */
  className?: string;
}

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Reusable newsletter signup form. Posts the email to the supplied endpoint
 * and renders inline status messages (success/error) without navigating.
 *
 * Designed to be embedded anywhere — landing page footer, blog sidebar,
 * dedicated landing section, etc.
 */
export function NewsletterSignup({
  endpoint = "/api/newsletter/subscribe",
  source = "landing-inline",
  title = "Stay in the loop",
  description = "Get notified when I publish new posts or projects. No spam, unsubscribe anytime.",
  placeholder = "you@example.com",
  buttonLabel = "Subscribe",
  className,
}: NewsletterSignupProps) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [message, setMessage] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          name: name.trim() || undefined,
          source,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        message?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Subscription failed");
      }

      setStatus("success");
      setMessage(data.message || "Thanks! Check your inbox to confirm.");
      setEmail("");
      setName("");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Something went wrong. Try again?",
      );
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6 sm:p-8",
        className,
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>

      {status === "success" ? (
        <div
          role="status"
          className="flex items-start gap-2 p-3 rounded-md border border-primary/40 bg-primary/5 text-sm text-foreground"
        >
          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder={placeholder}
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              className={cn(
                "flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "ring-offset-background placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              aria-label="Email address"
              disabled={status === "submitting"}
            />
            <Button
              type="submit"
              disabled={status === "submitting"}
              className="shrink-0"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subscribing…
                </>
              ) : (
                buttonLabel
              )}
            </Button>
          </div>

          {status === "error" && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-md border border-destructive/40 bg-destructive/5 text-sm text-destructive"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            By subscribing you agree to receive emails from me. Unsubscribe with
            one click in any email.
          </p>
        </form>
      )}
    </div>
  );
}
