"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button, Input, Label, Textarea, cn } from "@ecosystem/ui";
import { letterCheck, type LetterContent } from "@ecosystem/cv-core";
import { deleteLetterAction, saveLetterAction } from "@/actions/letters";
import type { loadLetterContext } from "@/actions/letters";

const LetterPdfPreview = dynamic(() => import("./letter-pdf-preview"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[70vh] items-center justify-center text-sm text-muted-foreground">
      Loading preview…
    </div>
  ),
});

type Ctx = NonNullable<Awaited<ReturnType<typeof loadLetterContext>>>;

export function LetterEditor({ initial }: { initial: Ctx }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.row.title);
  const [isPublic, setIsPublic] = useState(initial.row.isPublic);
  const [content, setContent] = useState<LetterContent>(initial.content);
  const [saved, setSaved] = useState(() =>
    JSON.stringify({
      title: initial.row.title,
      isPublic: initial.row.isPublic,
      content: initial.content,
    }),
  );
  const [updatedAt, setUpdatedAt] = useState(initial.row.updatedAt);
  const [busy, start] = useTransition();
  const [armed, setArmed] = useState(false);

  const dirty = JSON.stringify({ title, isPublic, content }) !== saved;
  const report = useMemo(() => letterCheck(content), [content]);

  const save = useCallback(() => {
    start(async () => {
      const r = await saveLetterAction(initial.row.slug, updatedAt, {
        title,
        isPublic,
        content,
      });
      if (!r.ok) return void toast.error(r.error);
      setUpdatedAt(r.data.updatedAt);
      setSaved(JSON.stringify({ title, isPublic, content }));
      toast.success("Saved");
    });
  }, [initial.row.slug, updatedAt, title, isPublic, content]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (dirty) save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [dirty, save]);

  const patch = (p: Partial<LetterContent>) =>
    setContent((c) => ({ ...c, ...p }));
  const patchTo = (p: Partial<LetterContent["recipient"]>) =>
    setContent((c) => ({ ...c, recipient: { ...c.recipient, ...p } }));
  const setPara = (i: number, v: string) =>
    patch({ paragraphs: content.paragraphs.map((p, j) => (j === i ? v : p)) });
  const back = initial.application
    ? `/dashboard/applications/${initial.application.id}`
    : "/dashboard/applications";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href={back}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {initial.application
            ? `${initial.application.role} at ${initial.application.company}`
            : "Job Tracker"}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Label htmlFor="lt-title" className="sr-only">
              Title
            </Label>
            <Input
              id="lt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-auto border-0 px-0 text-3xl font-bold tracking-tight shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Public on the CV site
            </label>
            <Button onClick={save} disabled={!dirty || busy}>
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {dirty ? "Save" : "Saved"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <section className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">Addressed to</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Row id="lt-company" label="Company">
                <Input
                  id="lt-company"
                  value={content.recipient.company}
                  onChange={(e) => patchTo({ company: e.target.value })}
                />
              </Row>
              <Row id="lt-rname" label="Recipient name">
                <Input
                  id="lt-rname"
                  value={content.recipient.name ?? ""}
                  onChange={(e) =>
                    patchTo({ name: e.target.value || undefined })
                  }
                />
              </Row>
              <Row id="lt-rtitle" label="Recipient title">
                <Input
                  id="lt-rtitle"
                  value={content.recipient.title ?? ""}
                  onChange={(e) =>
                    patchTo({ title: e.target.value || undefined })
                  }
                />
              </Row>
              <Row id="lt-date" label="Date">
                <Input
                  id="lt-date"
                  value={content.date ?? ""}
                  placeholder="e.g. 25 November 2026"
                  onChange={(e) => patch({ date: e.target.value || undefined })}
                />
              </Row>
              <div className="sm:col-span-2">
                <Row id="lt-subject" label="Subject">
                  <Input
                    id="lt-subject"
                    value={content.subject ?? ""}
                    onChange={(e) =>
                      patch({ subject: e.target.value || undefined })
                    }
                  />
                </Row>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">Letter</h2>
            <Row id="lt-sal" label="Salutation">
              <Input
                id="lt-sal"
                value={content.salutation}
                onChange={(e) => patch({ salutation: e.target.value })}
              />
            </Row>
            {content.paragraphs.map((p, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`lt-p${i}`}>Paragraph {i + 1}</Label>
                  {content.paragraphs.length > 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Remove paragraph ${i + 1}`}
                      onClick={() =>
                        patch({
                          paragraphs: content.paragraphs.filter(
                            (_, j) => j !== i,
                          ),
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
                <Textarea
                  id={`lt-p${i}`}
                  rows={5}
                  value={p}
                  onChange={(e) => setPara(i, e.target.value)}
                />
              </div>
            ))}
            {content.paragraphs.length < 8 ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  patch({ paragraphs: [...content.paragraphs, ""] })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add paragraph
              </Button>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Row id="lt-close" label="Closing">
                <Input
                  id="lt-close"
                  value={content.closing}
                  onChange={(e) => patch({ closing: e.target.value })}
                />
              </Row>
              <Row id="lt-sign" label="Signature">
                <Input
                  id="lt-sign"
                  value={content.signature}
                  onChange={(e) => patch({ signature: e.target.value })}
                />
              </Row>
            </div>
          </section>

          <section className="space-y-2 rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">
              Checks{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {report.words} words
              </span>
            </h2>
            {report.issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing to fix.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {report.issues.map((it, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      className={cn(
                        "mt-0.5 shrink-0 rounded px-1.5 text-xs font-medium",
                        it.level === "error"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {it.level === "error" ? "Fix" : "Check"}
                    </span>
                    <span>{it.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Button
            variant={armed ? "destructive" : "ghost"}
            size="sm"
            onBlur={() => setArmed(false)}
            onClick={() => {
              if (!armed) return setArmed(true);
              start(async () => {
                const r = await deleteLetterAction(initial.row.slug);
                if (!r.ok) return void toast.error(r.error);
                router.push(back);
                router.refresh();
              });
            }}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            {armed ? "Click again to delete" : "Delete letter"}
          </Button>
        </div>

        <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">
          <LetterPdfPreview
            content={content}
            style={initial.style}
            title={title}
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
