"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, FileText, Loader2, Plus } from "lucide-react";
import { Button } from "@ecosystem/ui";
import type { ApplicationDetail } from "@ecosystem/cv-core/applications";
import { createLetterAction } from "@/actions/letters";
import {
  attachDocumentAction,
  bundleSourcesAction,
  detachDocumentAction,
} from "@/actions/documents";
import { KIND_LABEL, openDocument } from "@/components/documents/library";

export type LibraryRef = { id: string; kind: string; title: string };

const fileSafe = (s: string) =>
  s.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") || "file";

/** Everything sent with an application: the CV, cover letters and library files. */
export function DocumentsPanel({
  app,
  library,
  onChange,
}: {
  app: ApplicationDetail;
  library: LibraryRef[];
  onChange: (a: ApplicationDetail) => void;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [zipping, setZipping] = useState(false);
  const attached = new Set(app.documents.map((d) => d.document.id));

  function toggle(id: string) {
    start(async () => {
      const r = attached.has(id)
        ? await detachDocumentAction(app.id, id)
        : await attachDocumentAction(app.id, id);
      if (!r.ok) return void toast.error(r.error);
      onChange(r.data);
    });
  }

  function newLetter() {
    start(async () => {
      const r = await createLetterAction(app.id);
      if (!r.ok) return void toast.error(r.error);
      router.push(`/dashboard/letters/${r.data.slug}`);
    });
  }

  async function downloadBundle() {
    setZipping(true);
    try {
      const r = await bundleSourcesAction(app.id);
      if (!r.ok) return void toast.error(r.error);
      const { cv, letters, files, company } = r.data;
      const [{ pdf }, { createElement }, cvPdf, letterPdf, { zipSync }] =
        await Promise.all([
          import("@react-pdf/renderer"),
          import("react"),
          import("@ecosystem/cv-core/pdf"),
          import("@ecosystem/cv-core/letter-pdf"),
          import("fflate"),
        ]);
      const out: Record<string, Uint8Array> = {};
      const bytes = async (blob: Blob) =>
        new Uint8Array(await blob.arrayBuffer());

      if (cv) {
        const blob = await pdf(
          cvPdf.createCvPdfElement(createElement, {
            content: cv.content,
            style: cv.style,
            title: cv.title,
          }),
        ).toBlob();
        out[`CV_${fileSafe(cv.content.header.name)}.pdf`] = await bytes(blob);
      }
      for (const l of letters) {
        const blob = await pdf(
          letterPdf.createLetterPdfElement(createElement, {
            content: l.content,
            style: l.style,
            title: l.title,
          }),
        ).toBlob();
        out[`Cover_Letter_${fileSafe(l.slug)}.pdf`] = await bytes(blob);
      }
      for (const f of files) {
        const res = await fetch(f.url);
        if (!res.ok) throw new Error(`Could not fetch ${f.fileName}`);
        out[`${fileSafe(f.kind)}_${f.fileName}`] = new Uint8Array(
          await res.arrayBuffer(),
        );
      }
      if (Object.keys(out).length === 0)
        return void toast.error("Nothing to bundle yet.");

      const zip = zipSync(out, { level: 0 });
      const url = URL.createObjectURL(
        new Blob([zip as BlobPart], { type: "application/zip" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `Application_${fileSafe(company)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bundle failed");
    } finally {
      setZipping(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">Documents</h2>
          <p className="text-xs text-muted-foreground">
            What goes out with this application.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={downloadBundle}
          disabled={zipping}
        >
          {zipping ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-3.5 w-3.5" />
          )}
          Bundle .zip
        </Button>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-medium">Cover letters</h3>
        {app.letters.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet.</p>
        ) : (
          <ul className="space-y-1">
            {app.letters.map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/dashboard/letters/${l.slug}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  {l.isPublic ? (
                    <span className="text-xs text-muted-foreground">
                      public
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Button size="sm" variant="outline" onClick={newLetter} disabled={busy}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          New cover letter
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">From the library</h3>
          <Link
            href="/dashboard/documents"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Manage library
          </Link>
        </div>
        {library.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Upload a diploma or transcript in the library first.
          </p>
        ) : (
          <ul className="space-y-1">
            {library.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                <input
                  id={`doc-${d.id}`}
                  type="checkbox"
                  checked={attached.has(d.id)}
                  disabled={busy}
                  onChange={() => toggle(d.id)}
                />
                <label
                  htmlFor={`doc-${d.id}`}
                  className="min-w-0 flex-1 truncate"
                >
                  {d.title}{" "}
                  <span className="text-xs text-muted-foreground">
                    {KIND_LABEL[d.kind] ?? d.kind}
                  </span>
                </label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void openDocument(d.id)}
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
