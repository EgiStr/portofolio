"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { createCvPdfElement } from "@ecosystem/cv-core/pdf";
import type { CvContent, CvStyle } from "@ecosystem/cv-core";

/**
 * Renders the exact PDF the public site serves (same cv-core layout), in the
 * browser, debounced. Load it with next/dynamic and ssr: false: on the server
 * react-pdf runs on a different React copy than the page.
 */
export default function PdfPreview({
  content,
  style,
  title,
}: {
  content: CvContent;
  style: CvStyle;
  title?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const last = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const blob = await pdf(
          createCvPdfElement(createElement, { content, style, title }),
        ).toBlob();
        if (cancelled) return;
        // Page count from the PDF itself, so the editor can warn past two pages.
        const text = await blob.text();
        setPages((text.match(/\/Type\s*\/Page[^s]/g) ?? []).length || null);
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
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {pages ? `${pages} page${pages > 1 ? "s" : ""}` : "PDF"}
          {pages && pages > 2 ? (
            <span className="ml-2 font-medium text-amber-600">
              over two pages
            </span>
          ) : null}
        </span>
        <span>{busy ? "Rendering…" : "Up to date"}</span>
      </div>
      {error ? (
        <p className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
          Preview failed: {error}
        </p>
      ) : url ? (
        <iframe
          title="CV PDF preview"
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
