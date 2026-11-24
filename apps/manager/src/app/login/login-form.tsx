"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label } from "@ecosystem/ui";
import { Eye, EyeOff, Github, Loader2 } from "lucide-react";

const ERRORS: Record<string, string> = {
  CredentialsSignin: "That email and password do not match.",
  OAuthAccountNotLinked: "That GitHub account is not linked to this workspace.",
  AccessDenied: "This account cannot sign in here.",
};

/** Only same-site paths, so the login page cannot be used as a redirect. */
function safeTarget(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export function LoginForm({ github }: { github: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const target = safeTarget(params.get("callbackUrl"));
  const initialError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState<"email" | "github" | null>(null);
  const [error, setError] = useState(
    initialError ? (ERRORS[initialError] ?? "Sign in failed. Try again.") : "",
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    setError("");
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError(ERRORS.CredentialsSignin);
        setBusy(null);
        return;
      }
      router.replace(target);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
      setBusy(null);
    }
  }

  return (
    <div className="w-full max-w-[340px]">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
        aria-hidden
      >
        E
      </span>
      <h1 className="mt-6 text-[28px] font-semibold leading-tight tracking-tight">
        Sign in
      </h1>
      <p className="mt-1.5 text-muted-foreground">
        Your workspace for the site, blog, CV and job search.
      </p>

      <div className="mt-8 space-y-4">
        {github && (
          <>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full"
              disabled={busy !== null}
              onClick={() => {
                setBusy("github");
                signIn("github", { callbackUrl: target });
              }}
            >
              {busy === "github" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Github className="mr-2 h-4 w-4" strokeWidth={1.75} />
              )}
              Continue with GitHub
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={reveal ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 pr-9"
                required
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={reveal ? "Hide password" : "Show password"}
                aria-pressed={reveal}
              >
                {reveal ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="h-9 w-full" disabled={busy !== null}>
            {busy === "email" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Private workspace. Only the owner has an account here.
      </p>
    </div>
  );
}
