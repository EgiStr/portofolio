"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { createLetterPdfElement } from "@ecosystem/cv-core/letter-pdf";
import type { CvStyle, LetterContent } from "@ecosystem/cv-core";

/** The cover letter PDF, rendered in the browser with the same layout code the server uses. Load with ssr: false. */
export default function LetterPdfPreview({
  content,
  style,
  title,
}: {
  content: LetterContent;
  style: CvStyle;
  title?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const last = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const blob = await pdf(
          createLetterPdfElement(createElement, { content, style, title }),
        ).toBlob();
        if (cancelled) return;
        const next = URL.createObjectURL(blob);
        if (last.current) URL.revokeObjectURL(last.current);
        last.current = next;
        setUrl(next);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [content, style, title]);

  useEffect(
    () => () => {
      if (last.current) URL.revokeObjectURL(last.current);
    },
    [],
  );

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex justify-end text-xs text-muted-foreground">
        {busy ? "Rendering…" : "Up to date"}
      </div>
      {error ? (
        <p className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
          Preview failed: {error}
        </p>
      ) : url ? (
        <iframe
          title="Cover letter PDF preview"
          src={`${url}#toolbar=0&navpanes=0&view=FitH`}
          className="min-h-[70vh] w-full flex-1 rounded-md border border-border bg-white"
        />
      ) : (
        <div className="flex min-h-[70vh] items-center justify-center rounded-md border border-border text-sm text-muted-foreground">
          Rendering preview…
        </div>
      )}
    </div>
  );
}
