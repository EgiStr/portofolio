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
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Badge, Button, Input, Label, Textarea } from "@ecosystem/ui";
import {
  atsCheck,
  parseStyle,
  plainText,
  STAGE_LABEL,
  STAGES,
  type Bullet,
  type CvContent,
  type CvStyle,
  type Entry,
  type Section,
  type Stage,
} from "@ecosystem/cv-core";
import {
  aiPolishAction,
  aiTailorAction,
  brainReadAction,
  brainSearchAction,
  logApplicationAction,
  profileDataAction,
  saveCvAction,
  type EditorVersion,
} from "@/actions/cv";
import type { AiSuggestion } from "@/lib/gemini";

const PdfPreview = dynamic(() => import("./pdf-preview"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[70vh] items-center justify-center text-sm text-muted-foreground">
      Loading preview…
    </div>
  ),
});

const STEPS = ["Target", "Header", "Sections", "Import", "Style"] as const;
type Step = (typeof STEPS)[number];
const uid = () => Math.random().toString(36).slice(2, 10);

function move<T>(list: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/* ------------------------------------------------------------------ */

export function CvEditor({
  initial,
  cvUrl,
}: {
  initial: EditorVersion;
  cvUrl: string;
}) {
  const [v, setV] = useState(initial);
  const [content, setContent] = useState<CvContent>(initial.content);
  const [style, setStyle] = useState<CvStyle>(parseStyle(initial.style));
  const [meta, setMeta] = useState({
    title: initial.title,
    targetRole: initial.targetRole ?? "",
    company: initial.company ?? "",
    jobDescription: initial.jobDescription ?? "",
  });
  const [step, setStep] = useState<Step>("Sections");
  const [facts, setFacts] = useState<{ path: string; text: string }[]>([]);
  const [saving, startSave] = useTransition();

  const dirty = useMemo(
    () =>
      JSON.stringify(content) !== JSON.stringify(v.content) ||
      JSON.stringify(style) !== JSON.stringify(parseStyle(v.style)) ||
      meta.title !== v.title ||
      meta.targetRole !== (v.targetRole ?? "") ||
      meta.company !== (v.company ?? "") ||
      meta.jobDescription !== (v.jobDescription ?? ""),
    [content, style, meta, v],
  );

  // Live lint on every keystroke: atsCheck is pure and fast.
  const ats = useMemo(
    () => atsCheck(content, meta.jobDescription || null),
    [content, meta.jobDescription],
  );

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useCallback(
    (extra: { isPublic?: boolean; isPrimary?: boolean } = {}) =>
      startSave(async () => {
        const r = await saveCvAction(v.slug, v.updatedAt, {
          title: meta.title,
          targetRole: meta.targetRole || null,
          company: meta.company || null,
          jobDescription: meta.jobDescription || null,
          content,
          style,
          ...extra,
        });
        if (!r.ok) return void toast.error(r.error);
        setV(r.data);
        setContent(r.data.content);
        setStyle(parseStyle(r.data.style));
        toast.success(`Saved. ATS ${r.data.ats.score}`);
      }),
    [v.slug, v.updatedAt, meta, content, style],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const publicUrl = v.isPrimary ? cvUrl : `${cvUrl}/v/${v.slug}`;
  const factTexts = facts.map((f) => f.text);

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/cv"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          CV Studio
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="min-w-0 truncate text-xl font-semibold">{meta.title}</h1>
        {v.isPrimary ? <Badge>Primary</Badge> : null}
        <Badge variant={v.isPublic ? "secondary" : "outline"}>
          {v.isPublic ? "Public" : "Private"}
        </Badge>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {dirty
              ? "Unsaved changes"
              : `Saved ${new Date(v.updatedAt).toLocaleString()}`}
          </span>
          {v.isPublic ? (
            <a
              className="text-sm underline-offset-4 hover:underline"
              href={`${publicUrl}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Public page
            </a>
          ) : null}
          <Button onClick={() => save()} disabled={saving || !dirty} size="sm">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left: steps */}
        <div className="min-w-0 space-y-4">
          <nav
            className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1"
            aria-label="Editor steps"
          >
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <span className="mr-1 opacity-60">{i + 1}</span>
                {s}
              </button>
            ))}
          </nav>

          {step === "Target" && (
            <TargetStep
              meta={meta}
              setMeta={setMeta}
              v={v}
              saving={saving}
              onPublish={(p) => save(p)}
              onLogged={(next) => setV(next)}
              content={content}
              setContent={setContent}
              facts={factTexts}
            />
          )}
          {step === "Header" && (
            <HeaderStep content={content} setContent={setContent} />
          )}
          {step === "Sections" && (
            <SectionsStep
              content={content}
              setContent={setContent}
              facts={factTexts}
              jobDescription={meta.jobDescription}
            />
          )}
          {step === "Import" && (
            <ImportStep
              content={content}
              setContent={setContent}
              facts={facts}
              setFacts={setFacts}
            />
          )}
          {step === "Style" && <StyleStep style={style} setStyle={setStyle} />}

          {facts.length ? (
            <div className="rounded-lg border border-border bg-card p-3 text-sm">
              <p className="mb-2 font-medium">
                Brain notes the AI may use as sources
              </p>
              <div className="flex flex-wrap gap-2">
                {facts.map((f) => (
                  <Badge key={f.path} variant="secondary" className="gap-1">
                    {f.path.split("/").pop()}
                    <button
                      aria-label={`Remove ${f.path}`}
                      onClick={() =>
                        setFacts(facts.filter((x) => x.path !== f.path))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: ATS + live PDF */}
        <div className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:self-start">
          <AtsPanel ats={ats} />
          <PdfPreview content={content} style={style} title={meta.title} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function AtsPanel({ ats }: { ats: ReturnType<typeof atsCheck> }) {
  const tone =
    ats.score >= 85
      ? "text-emerald-600"
      : ats.score >= 70
        ? "text-amber-600"
        : "text-destructive";
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline gap-3">
        <span className={`text-3xl font-bold tabular-nums ${tone}`}>
          {ats.score}
        </span>
        <span className="text-sm text-muted-foreground">
          ATS score · {ats.stats.words} words · {ats.stats.bullets} bullets
        </span>
      </div>
      {ats.keywords ? (
        <div className="mt-3 space-y-1 text-sm">
          <p>
            Job keywords covered:{" "}
            <strong>{Math.round(ats.keywords.coverage * 100)}%</strong>
          </p>
          {ats.keywords.missing.length ? (
            <p className="text-muted-foreground">
              Missing: {ats.keywords.missing.join(", ")}. Add only those you can
              back with real work.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Paste a job description in Target to check keyword coverage.
        </p>
      )}
      {ats.issues.length ? (
        <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-sm">
          {ats.issues.map((i, n) => (
            <li key={n} className="flex gap-2">
              <span
                className={
                  i.severity === "error"
                    ? "text-destructive"
                    : i.severity === "warn"
                      ? "text-amber-600"
                      : "text-muted-foreground"
                }
              >
                {i.severity}
              </span>
              <span>
                {i.message}
                {i.where ? (
                  <span className="text-muted-foreground"> ({i.where})</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-emerald-600">No structural issues.</p>
      )}
    </section>
  );
}

/* ---------------------------- Target ------------------------------ */

function TargetStep({
  meta,
  setMeta,
  v,
  saving,
  onPublish,
  onLogged,
  content,
  setContent,
  facts,
}: {
  meta: {
    title: string;
    targetRole: string;
    company: string;
    jobDescription: string;
  };
  setMeta: (m: {
    title: string;
    targetRole: string;
    company: string;
    jobDescription: string;
  }) => void;
  v: EditorVersion;
  saving: boolean;
  onPublish: (p: { isPublic?: boolean; isPrimary?: boolean }) => void;
  onLogged: (v: EditorVersion) => void;
  content: CvContent;
  setContent: (c: CvContent) => void;
  facts: string[];
}) {
  const [logging, startLog] = useTransition();
  const summaryIdx = content.sections.findIndex((s) => s.type === "paragraph");
  const summary = summaryIdx >= 0 ? content.sections[summaryIdx] : null;

  return (
    <div className="space-y-4">
      <Panel title="Target job">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="cv-title">Version name</Label>
            <Input
              id="cv-title"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cv-role">Role</Label>
            <Input
              id="cv-role"
              value={meta.targetRole}
              onChange={(e) => setMeta({ ...meta, targetRole: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cv-company">Company</Label>
            <Input
              id="cv-company"
              value={meta.company}
              onChange={(e) => setMeta({ ...meta, company: e.target.value })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="cv-jd">Job description</Label>
            <Textarea
              id="cv-jd"
              rows={8}
              value={meta.jobDescription}
              placeholder="Paste the posting. It stays private: it is never shown on the public page or written to the brain."
              onChange={(e) =>
                setMeta({ ...meta, jobDescription: e.target.value })
              }
            />
          </div>
        </div>
      </Panel>

      {summary && meta.jobDescription ? (
        <Panel title="Tailor the summary">
          <AiBox
            text={summary.text ?? ""}
            // The whole CV is a source: a skill shown in any section may be named in the summary.
            run={() =>
              aiTailorAction(summary.text ?? "", meta.jobDescription, [
                plainText(content),
                ...facts,
              ])
            }
            onAccept={(t) =>
              setContent({
                ...content,
                sections: content.sections.map((s, i) =>
                  i === summaryIdx ? { ...s, text: t } : s,
                ),
              })
            }
            label="Tailor summary to this job"
          />
        </Panel>
      ) : null}

      <Panel title="Publish">
        <p className="text-sm text-muted-foreground">
          Public versions get their own link (hidden from search engines). The
          primary version is the CV at the site root and the resume link on the
          website. Unsaved edits are saved with the change.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={saving || v.isPrimary}
            onClick={() => onPublish({ isPublic: !v.isPublic })}
          >
            {v.isPublic ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {v.isPublic ? "Make private" : "Make public"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={saving || v.isPrimary}
            onClick={() => onPublish({ isPrimary: true })}
          >
            Make primary
          </Button>
        </div>
      </Panel>

      <Panel title="Job application">
        {v.isPrimary ? (
          <p className="text-sm text-muted-foreground">
            The primary CV is shared by every application. To record that you
            sent it as is, open the application in the{" "}
            <Link
              href="/dashboard/applications"
              className="underline underline-offset-4"
            >
              Job Tracker
            </Link>{" "}
            and choose &ldquo;Sent the primary CV as is&rdquo;.
          </p>
        ) : v.application ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href={`/dashboard/applications/${v.application.id}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              {v.application.role} at {v.application.company}
            </Link>
            <select
              aria-label="Application stage"
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
              value={v.application.stage}
              disabled={logging}
              onChange={(e) => {
                const stage = e.target.value as Stage;
                startLog(async () => {
                  const r = await logApplicationAction(v.slug, stage);
                  if (!r.ok) return void toast.error(r.error);
                  onLogged(r.data);
                  toast.success(STAGE_LABEL[stage]);
                });
              }}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
            {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <p className="w-full text-sm text-muted-foreground">
              Not tracked yet. Tracking adds it to the Job Tracker with this
              version as the CV sent; stage changes are also written to the
              brain when it is configured.
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={logging || !v.company}
              onClick={() =>
                startLog(async () => {
                  const r = await logApplicationAction(v.slug, "WISHLIST");
                  if (!r.ok) return void toast.error(r.error);
                  onLogged(r.data);
                  toast.success("Added to the Job Tracker");
                })
              }
            >
              {logging ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BookOpen className="mr-2 h-4 w-4" />
              )}
              Track this application
            </Button>
            {!v.company ? (
              <span className="text-xs text-muted-foreground">
                Save a company first.
              </span>
            ) : null}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ---------------------------- Header ------------------------------ */

function HeaderStep({
  content,
  setContent,
}: {
  content: CvContent;
  setContent: (c: CvContent) => void;
}) {
  const h = content.header;
  const set = (patch: Partial<typeof h>) =>
    setContent({ ...content, header: { ...h, ...patch } });
  const field = (
    key: "name" | "headline" | "location" | "email" | "phone",
    label: string,
  ) => (
    <div className="space-y-1">
      <Label htmlFor={`h-${key}`}>{label}</Label>
      <Input
        id={`h-${key}`}
        value={h[key] ?? ""}
        onChange={(e) => set({ [key]: e.target.value || undefined })}
      />
    </div>
  );
  return (
    <Panel title="Header">
      <div className="grid gap-3 sm:grid-cols-2">
        {field("name", "Name")}
        {field("headline", "Headline")}
        {field("location", "Location")}
        {field("email", "Email")}
        {field("phone", "Phone (PDF only unless Style allows it on the web)")}
      </div>
      <div className="space-y-2">
        <Label>Links</Label>
        {h.links.map((l, i) => (
          <div key={i} className="flex gap-2">
            <Input
              aria-label="Link label"
              value={l.label}
              onChange={(e) =>
                set({
                  links: h.links.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x,
                  ),
                })
              }
            />
            <Input
              aria-label="Link URL"
              value={l.url}
              onChange={(e) =>
                set({
                  links: h.links.map((x, j) =>
                    j === i ? { ...x, url: e.target.value } : x,
                  ),
                })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove link"
              onClick={() => set({ links: h.links.filter((_, j) => j !== i) })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            set({ links: [...h.links, { label: "", url: "https://" }] })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add link
        </Button>
      </div>
    </Panel>
  );
}

/* --------------------------- Sections ----------------------------- */

function SectionsStep({
  content,
  setContent,
  facts,
  jobDescription,
}: {
  content: CvContent;
  setContent: (c: CvContent) => void;
  facts: string[];
  jobDescription: string;
}) {
  const setSection = (i: number, s: Section) =>
    setContent({
      ...content,
      sections: content.sections.map((x, j) => (j === i ? s : x)),
    });
  const [newType, setNewType] = useState<Section["type"]>("entries");

  return (
    <div className="space-y-4">
      {content.sections.map((s, i) => (
        <Panel
          key={s.id}
          title={s.title || "Untitled section"}
          action={
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Move section up"
                onClick={() =>
                  setContent({
                    ...content,
                    sections: move(content.sections, i, -1),
                  })
                }
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Move section down"
                onClick={() =>
                  setContent({
                    ...content,
                    sections: move(content.sections, i, 1),
                  })
                }
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={s.hidden ? "Show section" : "Hide section"}
                onClick={() => setSection(i, { ...s, hidden: !s.hidden })}
              >
                {s.hidden ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete section"
                onClick={() =>
                  setContent({
                    ...content,
                    sections: content.sections.filter((_, j) => j !== i),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          }
        >
          <Input
            aria-label="Section title"
            value={s.title}
            onChange={(e) => setSection(i, { ...s, title: e.target.value })}
          />
          {s.type === "paragraph" && (
            <Textarea
              rows={5}
              aria-label={`${s.title} text`}
              value={s.text ?? ""}
              onChange={(e) => setSection(i, { ...s, text: e.target.value })}
            />
          )}
          {s.type === "entries" && (
            <div className="space-y-3">
              {(s.entries ?? []).map((e, k) => (
                <EntryEditor
                  key={e.id}
                  entry={e}
                  facts={facts}
                  jobDescription={jobDescription}
                  onChange={(next) =>
                    setSection(i, {
                      ...s,
                      entries: (s.entries ?? []).map((x, j) =>
                        j === k ? next : x,
                      ),
                    })
                  }
                  onMove={(d) =>
                    setSection(i, {
                      ...s,
                      entries: move(s.entries ?? [], k, d),
                    })
                  }
                  onRemove={() =>
                    setSection(i, {
                      ...s,
                      entries: (s.entries ?? []).filter((_, j) => j !== k),
                    })
                  }
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSection(i, {
                    ...s,
                    entries: [
                      ...(s.entries ?? []),
                      { id: uid(), title: "New entry", bullets: [] },
                    ],
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add entry
              </Button>
            </div>
          )}
          {s.type === "list" && (
            <BulletList
              bullets={s.items ?? []}
              onChange={(items) => setSection(i, { ...s, items })}
              facts={facts}
              jobDescription={jobDescription}
              context={s.title}
              withLead
            />
          )}
        </Panel>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="New section type"
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          value={newType}
          onChange={(e) => setNewType(e.target.value as Section["type"])}
        >
          <option value="entries">Entries (jobs, projects)</option>
          <option value="list">List (skills, certifications)</option>
          <option value="paragraph">Paragraph</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setContent({
              ...content,
              sections: [
                ...content.sections,
                {
                  id: uid(),
                  title: "New section",
                  type: newType,
                  ...(newType === "entries"
                    ? { entries: [] }
                    : newType === "list"
                      ? { items: [] }
                      : { text: "" }),
                },
              ],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add section
        </Button>
      </div>
    </div>
  );
}

function EntryEditor({
  entry,
  onChange,
  onMove,
  onRemove,
  facts,
  jobDescription,
}: {
  entry: Entry;
  onChange: (e: Entry) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
  facts: string[];
  jobDescription: string;
}) {
  return (
    <div
      className={`space-y-2 rounded-md border border-border p-3 ${entry.hidden ? "opacity-60" : ""}`}
    >
      <div className="flex gap-2">
        <Input
          aria-label="Entry title"
          value={entry.title}
          onChange={(e) => onChange({ ...entry, title: e.target.value })}
          className="font-medium"
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Move entry up"
          onClick={() => onMove(-1)}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Move entry down"
          onClick={() => onMove(1)}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={entry.hidden ? "Show entry" : "Hide entry"}
          onClick={() => onChange({ ...entry, hidden: !entry.hidden })}
        >
          {entry.hidden ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete entry"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Input
        aria-label="Entry details"
        placeholder="Organisation | Place | Mon YYYY - Mon YYYY"
        value={entry.meta ?? ""}
        onChange={(e) =>
          onChange({ ...entry, meta: e.target.value || undefined })
        }
      />
      <BulletList
        bullets={entry.bullets}
        onChange={(bullets) => onChange({ ...entry, bullets })}
        facts={facts}
        jobDescription={jobDescription}
        context={`${entry.title}\n${entry.meta ?? ""}`}
      />
      {entry.source ? (
        <p className="text-xs text-muted-foreground">
          From website {entry.source.table}
        </p>
      ) : null}
    </div>
  );
}

function BulletList({
  bullets,
  onChange,
  facts,
  jobDescription,
  context,
  withLead,
}: {
  bullets: Bullet[];
  onChange: (b: Bullet[]) => void;
  facts: string[];
  jobDescription: string;
  context: string;
  withLead?: boolean;
}) {
  const [aiFor, setAiFor] = useState<number | null>(null);
  const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

  return (
    <ul className="space-y-2">
      {bullets.map((b, i) => (
        <li key={i} className="space-y-1">
          <div className="flex gap-2">
            {withLead ? (
              <Input
                aria-label="Bold lead"
                className="w-36 shrink-0"
                value={b.lead ?? ""}
                onChange={(e) =>
                  onChange(
                    bullets.map((x, j) =>
                      j === i ? { ...x, lead: e.target.value || undefined } : x,
                    ),
                  )
                }
              />
            ) : null}
            <Textarea
              aria-label={`Bullet ${i + 1}`}
              rows={2}
              value={b.text}
              onChange={(e) =>
                onChange(
                  bullets.map((x, j) =>
                    j === i ? { ...x, text: e.target.value } : x,
                  ),
                )
              }
            />
            <div className="flex shrink-0 flex-col">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Improve with AI"
                onClick={() => setAiFor(aiFor === i ? null : i)}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete bullet"
                onClick={() => onChange(bullets.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p
            className={`text-right text-xs ${words(b.text) > 45 ? "text-amber-600" : "text-muted-foreground"}`}
          >
            {words(b.text)} words
          </p>
          {aiFor === i ? (
            <AiBox
              text={b.text}
              run={() =>
                aiPolishAction(
                  b.text,
                  [
                    context,
                    ...bullets.filter((_, j) => j !== i).map((x) => x.text),
                    ...facts,
                  ],
                  jobDescription || null,
                )
              }
              onAccept={(t) => {
                onChange(
                  bullets.map((x, j) => (j === i ? { ...x, text: t } : x)),
                );
                setAiFor(null);
              }}
              label="Suggest a tighter bullet"
            />
          ) : null}
        </li>
      ))}
      <li>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...bullets, { text: "" }])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add bullet
        </Button>
      </li>
    </ul>
  );
}

/** Runs an AI action and shows accepted lines, refused lines and gaps. */
function AiBox({
  text,
  run,
  onAccept,
  label,
}: {
  text: string;
  run: () => Promise<
    { ok: true; data: AiSuggestion } | { ok: false; error: string }
  >;
  onAccept: (t: string) => void;
  label: string;
}) {
  const [busy, start] = useTransition();
  const [res, setRes] = useState<AiSuggestion | null>(null);
  return (
    <div className="space-y-2 rounded-md border border-dashed border-border p-3 text-sm">
      <Button
        size="sm"
        variant="secondary"
        disabled={busy || !text.trim()}
        onClick={() =>
          start(async () => {
            const r = await run();
            if (!r.ok) return void toast.error(r.error);
            setRes(r.data);
          })
        }
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {label}
      </Button>
      {res ? (
        <div className="space-y-2">
          {res.lines.map((l, n) => (
            <div
              key={n}
              className="flex items-start gap-2 rounded bg-secondary/50 p-2"
            >
              <p className="flex-1">{l}</p>
              <Button size="sm" variant="outline" onClick={() => onAccept(l)}>
                Use
              </Button>
            </div>
          ))}
          {res.rejected.map((r, n) => (
            <p key={n} className="text-muted-foreground">
              <span className="text-amber-600">Refused</span> (not in your
              sources: {r.unknown.join(", ")}):{" "}
              <span className="line-through">{r.text}</span>
            </p>
          ))}
          {!res.lines.length && !res.rejected.length ? (
            <p className="text-muted-foreground">
              No suggestion. Keep the original.
            </p>
          ) : null}
          {res.gaps.length ? (
            <div>
              <p className="font-medium">
                Facts that would make it stronger, if true:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {res.gaps.map((g, n) => (
                  <li key={n}>{g}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------- Import ------------------------------ */

type Profile = Extract<
  Awaited<ReturnType<typeof profileDataAction>>,
  { ok: true }
>["data"];

function ImportStep({
  content,
  setContent,
  facts,
  setFacts,
}: {
  content: CvContent;
  setContent: (c: CvContent) => void;
  facts: { path: string; text: string }[];
  setFacts: (f: { path: string; text: string }[]) => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, startLoad] = useTransition();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<
    { path: string; title: string; snippet?: string }[] | null
  >(null);
  const [brainMsg, setBrainMsg] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const entrySections = content.sections
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.type === "entries");
  const [target, setTarget] = useState<number>(entrySections[0]?.i ?? -1);

  const used = new Set(
    content.sections.flatMap((s) =>
      (s.entries ?? []).map((e) => e.source?.id).filter(Boolean),
    ),
  );

  const addEntry = (e: Entry) => {
    const s = content.sections[target];
    if (!s) return;
    setContent({
      ...content,
      sections: content.sections.map((x, j) =>
        j === target
          ? { ...s, entries: [...(s.entries ?? []), { ...e, id: uid() }] }
          : x,
      ),
    });
    toast.success(`Added to ${s.title}`);
  };

  return (
    <div className="space-y-4">
      <Panel
        title="Website records"
        action={
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() =>
              startLoad(async () => {
                const r = await profileDataAction();
                if (!r.ok) return void toast.error(r.error);
                setProfile(r.data);
              })
            }
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {profile ? "Reload" : "Load"}
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          Experience, projects, certifications and skills from
          www.eggisatria.my.id. Edit them in their own pages; copies here are
          yours to tighten.
        </p>
        {profile ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Label htmlFor="import-target">Add entries to</Label>
              <select
                id="import-target"
                className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
              >
                {entrySections.map(({ s, i }) => (
                  <option key={s.id} value={i}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            {(["experience", "projects"] as const).map((k) => (
              <div key={k}>
                <p className="mb-1 text-sm font-medium capitalize">{k}</p>
                <ul className="max-h-64 space-y-1 overflow-auto">
                  {profile[k].map((e) => (
                    <li key={e.id} className="flex items-center gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">
                        {e.title}{" "}
                        <span className="text-muted-foreground">{e.meta}</span>
                      </span>
                      {e.source && used.has(e.source.id) ? (
                        <Badge variant="outline">In CV</Badge>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addEntry(e)}
                        disabled={target < 0}
                      >
                        Add
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setContent({
                    ...content,
                    sections: [
                      ...content.sections,
                      {
                        id: uid(),
                        title: "Skills",
                        type: "list",
                        items: profile.skills,
                      },
                    ],
                  })
                }
              >
                Add skills section from website
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setContent({
                    ...content,
                    sections: [
                      ...content.sections,
                      {
                        id: uid(),
                        title: "Certifications",
                        type: "list",
                        items: profile.certifications,
                      },
                    ],
                  })
                }
              >
                Add certifications section from website
              </Button>
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel title="Second brain">
        <p className="text-sm text-muted-foreground">
          Search your notes and pin the ones that hold real facts. The AI may
          only use what pinned notes and the CV already say.
        </p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!query.trim()) return;
            startSearch(async () => {
              const r = await brainSearchAction(query);
              if (!r.ok) return void toast.error(r.error);
              setBrainMsg(
                r.data.configured
                  ? null
                  : "Brain is not configured on this server (BRAIN_MCP_URL, BRAIN_MCP_TOKEN).",
              );
              setHits(r.data.hits);
            });
          }}
        >
          <Input
            aria-label="Search the brain"
            value={query}
            placeholder="e.g. GuavaCam accuracy"
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={searching}>
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </form>
        {brainMsg ? <p className="text-sm text-amber-600">{brainMsg}</p> : null}
        {hits ? (
          hits.length ? (
            <ul className="space-y-2">
              {hits.map((h) => (
                <li
                  key={h.path}
                  className="rounded-md border border-border p-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {h.title}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={facts.some((f) => f.path === h.path)}
                      onClick={async () => {
                        const r = await brainReadAction(h.path);
                        if (!r.ok || !r.data)
                          return void toast.error(
                            r.ok ? "Note is empty" : r.error,
                          );
                        setFacts([
                          ...facts,
                          { path: h.path, text: r.data.slice(0, 6000) },
                        ]);
                      }}
                    >
                      Pin as source
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{h.path}</p>
                  {h.snippet ? (
                    <p className="mt-1 text-muted-foreground">{h.snippet}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No notes matched.</p>
          )
        ) : null}
      </Panel>
    </div>
  );
}

/* ----------------------------- Style ------------------------------ */

function StyleStep({
  style,
  setStyle,
}: {
  style: CvStyle;
  setStyle: (s: CvStyle) => void;
}) {
  const range = (
    key: "fontSize" | "lineHeight" | "margin",
    label: string,
    min: number,
    max: number,
    stepBy: number,
  ) => (
    <div className="space-y-1">
      <Label htmlFor={`st-${key}`}>
        {label}: <span className="tabular-nums">{style[key]}</span>
      </Label>
      <input
        id={`st-${key}`}
        type="range"
        min={min}
        max={max}
        step={stepBy}
        value={style[key]}
        onChange={(e) => setStyle({ ...style, [key]: Number(e.target.value) })}
        className="w-full"
      />
    </div>
  );
  return (
    <Panel title="Style">
      <p className="text-sm text-muted-foreground">
        One column and standard fonts on purpose: that is what applicant
        tracking systems parse reliably.
      </p>
      <div className="space-y-1">
        <Label htmlFor="st-font">Font</Label>
        <select
          id="st-font"
          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
          value={style.font}
          onChange={(e) =>
            setStyle({ ...style, font: e.target.value as CvStyle["font"] })
          }
        >
          <option value="Helvetica">Helvetica (sans)</option>
          <option value="Times-Roman">Times (serif)</option>
        </select>
      </div>
      {range("fontSize", "Font size (pt)", 9, 12, 0.5)}
      {range("lineHeight", "Line height", 1, 1.5, 0.05)}
      {range("margin", "Page margin (pt)", 24, 72, 2)}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={style.showPhoneOnWeb}
          onChange={(e) =>
            setStyle({ ...style, showPhoneOnWeb: e.target.checked })
          }
        />
        Show the phone number on the public web page (the PDF always has it)
      </label>
    </Panel>
  );
}
