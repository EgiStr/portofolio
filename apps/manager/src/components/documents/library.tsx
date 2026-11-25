"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Loader2, Trash2, Upload } from "lucide-react";
import { Button, Input, Label } from "@ecosystem/ui";
import {
  deleteDocumentAction,
  documentLinkAction,
  uploadDocumentAction,
} from "@/actions/documents";

export const KIND_LABEL: Record<string, string> = {
  DIPLOMA: "Diploma (ijazah)",
  TRANSCRIPT: "Transcript (transkrip)",
  CERTIFICATE: "Certificate",
  OTHER: "Other",
};

export type LibraryDoc = {
  id: string;
  kind: string;
  title: string;
  fileName: string;
  sizeBytes: number;
  attachedTo: number;
};

const size = (n: number) =>
  n > 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

export async function openDocument(id: string) {
  const r = await documentLinkAction(id);
  if (!r.ok) return void toast.error(r.error);
  window.open(r.data.url, "_blank", "noopener,noreferrer");
}

export function DocumentLibrary({ docs }: { docs: LibraryDoc[] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [armed, setArmed] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    start(async () => {
      const r = await uploadDocumentAction(data);
      if (!r.ok) return void toast.error(r.error);
      formRef.current?.reset();
      toast.success("Uploaded");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        onSubmit={upload}
        className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end"
      >
        <div className="space-y-1">
          <Label htmlFor="doc-file">File (PDF, PNG or JPG, up to 10 MB)</Label>
          <Input
            id="doc-file"
            name="file"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="doc-kind">Type</Label>
          <select
            id="doc-kind"
            name="kind"
            defaultValue="DIPLOMA"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {Object.entries(KIND_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="doc-title">Title</Label>
          <Input
            id="doc-title"
            name="title"
            placeholder="Defaults to the file name"
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload
        </Button>
      </form>

      {docs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No documents yet. Upload your diploma and transcript once, then attach
          them to any application.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">
                  {KIND_LABEL[d.kind] ?? d.kind} · {d.fileName} ·{" "}
                  {size(d.sizeBytes)} · attached to {d.attachedTo}{" "}
                  {d.attachedTo === 1 ? "application" : "applications"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void openDocument(d.id)}
                >
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  Open
                </Button>
                <Button
                  size="sm"
                  variant={armed === d.id ? "destructive" : "ghost"}
                  disabled={busy}
                  onBlur={() => setArmed(null)}
                  onClick={() => {
                    if (armed !== d.id) return setArmed(d.id);
                    start(async () => {
                      const r = await deleteDocumentAction(d.id);
                      if (!r.ok) return void toast.error(r.error);
                      setArmed(null);
                      router.refresh();
                    });
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  {armed === d.id ? "Click again" : "Delete"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
