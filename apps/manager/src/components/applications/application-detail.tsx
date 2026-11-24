"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  Unlink,
} from "lucide-react";
import { Badge, Button, Label, Textarea, cn } from "@ecosystem/ui";
import {
  ACTIVE_STAGES,
  CLOSED_STAGES,
  EVENT_KINDS,
  STAGE_LABEL,
  isClosed,
  isOverdue,
  type EventKind,
  type Stage,
} from "@ecosystem/cv-core";
import type { ApplicationDetail } from "@ecosystem/cv-core/applications";
import {
  addEventAction,
  deleteApplicationAction,
  deleteEventAction,
  getApplicationAction,
  linkVersionAction,
  moveStageAction,
  newVersionForAction,
  saveApplicationAction,
  setSentCvAction,
  syncBrainAction,
} from "@/actions/applications";
import { Field, SOURCES } from "./tracker-board";

type VersionRef = {
  slug: string;
  title: string;
  isPrimary: boolean;
  applicationId: string | null;
};

const KIND_LABEL: Record<EventKind, string> = {
  stage: "Stage change",
  interview: "Interview",
  assessment: "Test / assessment",
  note: "Note",
  follow_up: "Follow-up",
};

const dateInput = (d: Date | string | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";
const when = (d: Date | string) =>
  new Date(d).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function formOf(a: ApplicationDetail) {
  return {
    company: a.company,
    role: a.role,
    location: a.location ?? "",
    source: a.source ?? "",
    jobUrl: a.jobUrl ?? "",
    jobDescription: a.jobDescription ?? "",
    appliedAt: dateInput(a.appliedAt),
    followUpAt: dateInput(a.followUpAt),
    contactName: a.contactName ?? "",
    contactEmail: a.contactEmail ?? "",
    contactUrl: a.contactUrl ?? "",
    salaryExpected: a.salaryExpected ?? "",
    salaryOffer: a.salaryOffer ?? "",
    notes: a.notes ?? "",
  };
}
type Form = ReturnType<typeof formOf>;

export function ApplicationDetailView({
  initial,
  allVersions,
  brain,
}: {
  initial: ApplicationDetail;
  allVersions: VersionRef[];
  brain: boolean;
}) {
  const router = useRouter();
  const [app, setApp] = useState(initial);
  const [form, setForm] = useState<Form>(() => formOf(initial));
  const [saved, setSaved] = useState<Form>(() => formOf(initial));
  const [busy, start] = useTransition();
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  // Server results replace the timeline, versions and stage; unsaved field edits stay.
  const take = useCallback((next: ApplicationDetail, resetForm = false) => {
    setApp(next);
    if (resetForm) {
      setForm(formOf(next));
      setSaved(formOf(next));
    }
  }, []);

  const save = useCallback(() => {
    start(async () => {
      const r = await saveApplicationAction(
        app.id,
        new Date(app.updatedAt).toISOString(),
        {
          ...form,
          appliedAt: form.appliedAt || null,
          followUpAt: form.followUpAt || null,
        },
      );
      if (!r.ok) return void toast.error(r.error);
      take(r.data, true);
      toast.success("Saved");
    });
  }, [app.id, app.updatedAt, form, take]);

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

  function moveTo(stage: Stage) {
    if (stage === app.stage) return;
    start(async () => {
      const r = await moveStageAction(app.id, stage);
      if (!r.ok) return void toast.error(r.error);
      // Pull the new timeline and version stamp; keep unsaved edits, but adopt the applied date if it was set now.
      const fresh = await getApplicationAction(app.id);
      if (fresh.ok) {
        take(fresh.data);
        if (!form.appliedAt && fresh.data.appliedAt) {
          const appliedAt = dateInput(fresh.data.appliedAt);
          setForm((f) => ({ ...f, appliedAt }));
          setSaved((s) => ({ ...s, appliedAt }));
        }
      }
      toast.success(STAGE_LABEL[stage]);
    });
  }

  const set =
    (k: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });
  const overdue = isOverdue(app.followUpAt, app.stage);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/dashboard/applications"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Job Tracker
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight [text-wrap:balance]">
              {app.role} <span className="text-muted-foreground">at</span>{" "}
              {app.company}
            </h1>
            <p className="text-sm text-muted-foreground">
              {[
                app.location,
                app.source,
                app.appliedAt
                  ? `applied ${dateInput(app.appliedAt)}`
                  : "not applied yet",
              ]
                .filter(Boolean)
                .join(" · ")}
              {overdue ? (
                <span className="ml-2 font-medium text-destructive">
                  Follow-up overdue
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex gap-2">
            {app.jobUrl ? (
              <Button variant="outline" asChild>
                <a href={app.jobUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Posting
                </a>
              </Button>
            ) : null}
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

        <StageStepper stage={app.stage} onPick={moveTo} disabled={busy} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-6">
          <section className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                id="ap-company"
                label="Company"
                value={form.company}
                onChange={set("company")}
              />
              <Field
                id="ap-role"
                label="Role"
                value={form.role}
                onChange={set("role")}
              />
              <Field
                id="ap-location"
                label="Location"
                value={form.location}
                onChange={set("location")}
              />
              <div className="space-y-1">
                <Field
                  id="ap-source"
                  label="Source"
                  list="ap-sources"
                  value={form.source}
                  onChange={set("source")}
                />
                <datalist id="ap-sources">
                  {SOURCES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div className="sm:col-span-2">
                <Field
                  id="ap-url"
                  label="Job posting link"
                  type="url"
                  value={form.jobUrl}
                  onChange={set("jobUrl")}
                />
              </div>
              <Field
                id="ap-applied"
                label="Applied on"
                type="date"
                value={form.appliedAt}
                onChange={set("appliedAt")}
              />
              <Field
                id="ap-follow"
                label="Follow up on"
                type="date"
                value={form.followUpAt}
                onChange={set("followUpAt")}
                hint="Shown as overdue on the board once this date passes."
              />
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div>
              <h2 className="font-semibold">Contact and salary</h2>
              <p className="text-xs text-muted-foreground">
                Kept in this database only. Never written to the brain or shown
                on the CV site.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                id="ap-cname"
                label="Recruiter"
                value={form.contactName}
                onChange={set("contactName")}
              />
              <Field
                id="ap-cemail"
                label="Email"
                type="email"
                value={form.contactEmail}
                onChange={set("contactEmail")}
              />
              <Field
                id="ap-curl"
                label="LinkedIn or other link"
                value={form.contactUrl}
                onChange={set("contactUrl")}
              />
              <Field
                id="ap-sexp"
                label="Expected salary"
                value={form.salaryExpected}
                onChange={set("salaryExpected")}
                placeholder="IDR per month"
              />
              <Field
                id="ap-soff"
                label="Offer"
                value={form.salaryOffer}
                onChange={set("salaryOffer")}
              />
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="space-y-1">
              <Label htmlFor="ap-jd">Job description</Label>
              <Textarea
                id="ap-jd"
                rows={8}
                value={form.jobDescription}
                onChange={set("jobDescription")}
              />
              <p className="text-xs text-muted-foreground">
                New CV versions for this application copy it and are scored
                against it.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ap-notes">Notes</Label>
              <Textarea
                id="ap-notes"
                rows={4}
                value={form.notes}
                onChange={set("notes")}
              />
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <VersionsPanel app={app} allVersions={allVersions} onChange={take} />
          <Timeline app={app} onChange={take} />
          <BrainPanel app={app} brain={brain} />
          <DeleteApplication
            id={app.id}
            onDeleted={() => {
              router.push("/dashboard/applications");
              router.refresh();
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StageStepper({
  stage,
  onPick,
  disabled,
}: {
  stage: Stage;
  onPick: (s: Stage) => void;
  disabled: boolean;
}) {
  const at = ACTIVE_STAGES.indexOf(stage);
  const closed = isClosed(stage);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ol className="flex flex-wrap gap-1" aria-label="Stage">
        {ACTIVE_STAGES.map((s, i) => {
          const done = !closed && i < at;
          const current = s === stage;
          return (
            <li key={s}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(s)}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  current &&
                    "border-primary bg-primary text-primary-foreground",
                  done && "border-primary/40 bg-primary/10",
                  !current &&
                    !done &&
                    "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : null}
                {STAGE_LABEL[s]}
              </button>
            </li>
          );
        })}
      </ol>
      <select
        aria-label="Close application"
        disabled={disabled}
        className={cn(
          "h-8 rounded-full border border-border bg-background px-2 text-xs",
          closed && "border-primary font-medium",
        )}
        value={closed ? stage : ""}
        onChange={(e) => e.target.value && onPick(e.target.value as Stage)}
      >
        <option value="">Close as…</option>
        {CLOSED_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}

function VersionsPanel({
  app,
  allVersions,
  onChange,
}: {
  app: ApplicationDetail;
  allVersions: VersionRef[];
  onChange: (a: ApplicationDetail) => void;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const primary = allVersions.find((v) => v.isPrimary);
  const [base, setBase] = useState(
    app.versions[0]?.slug ?? primary?.slug ?? "",
  );
  const unlinked = allVersions.filter((v) => !v.isPrimary && !v.applicationId);
  const [pick, setPick] = useState(unlinked[0]?.slug ?? "");
  const act = (
    fn: () => Promise<
      { ok: true; data: ApplicationDetail } | { ok: false; error: string }
    >,
  ) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error);
      onChange(r.data);
      router.refresh();
    });

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="font-semibold">CV versions</h2>
        <p className="text-xs text-muted-foreground">
          Tailor as many versions as you need, then mark the one you sent.
        </p>
      </div>

      {app.sentCv ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-primary/40 bg-primary/5 p-2 text-sm">
          <span className="min-w-0 truncate">
            <Send className="mr-1.5 inline h-3.5 w-3.5" />
            Sent:{" "}
            <Link
              href={`/dashboard/cv/${app.sentCv.slug}`}
              className="font-medium hover:underline"
            >
              {app.sentCv.title}
            </Link>
            {app.sentCv.atsScore != null ? (
              <span className="text-muted-foreground">
                {" "}
                · ATS {app.sentCv.atsScore}
              </span>
            ) : null}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => act(() => setSentCvAction(app.id, null))}
          >
            Clear
          </Button>
        </div>
      ) : null}

      <ul className="space-y-2">
        {app.versions.map((v) => {
          const jdChanged =
            (v.jobDescription ?? "") !== (app.jobDescription ?? "");
          const sent = app.sentCv?.slug === v.slug;
          return (
            <li
              key={v.slug}
              className="space-y-1.5 rounded-md border border-border p-2 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/dashboard/cv/${v.slug}`}
                  className="min-w-0 font-medium hover:underline"
                >
                  <FileText className="mr-1 inline h-3.5 w-3.5" />
                  {v.title}
                </Link>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {v.atsScore != null ? `ATS ${v.atsScore}` : "No score"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant={v.isPublic ? "secondary" : "outline"}>
                  {v.isPublic ? "Public" : "Private"}
                </Badge>
                {jdChanged ? (
                  <Badge
                    variant="outline"
                    title="The application's job description changed after this version was made. Update it in the editor to rescore."
                  >
                    JD changed
                  </Badge>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  edited {dateInput(v.updatedAt)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant={sent ? "secondary" : "outline"}
                  disabled={busy || sent}
                  onClick={() => act(() => setSentCvAction(app.id, v.slug))}
                >
                  <Send className="mr-1 h-3.5 w-3.5" />
                  {sent ? "Sent" : "Mark as sent"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    act(() => linkVersionAction(app.id, v.slug, false))
                  }
                >
                  <Unlink className="mr-1 h-3.5 w-3.5" />
                  Unlink
                </Button>
              </div>
            </li>
          );
        })}
        {!app.versions.length ? (
          <li className="text-sm text-muted-foreground">
            No tailored version yet.
          </li>
        ) : null}
      </ul>

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Copy from"
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
            value={base}
            onChange={(e) => setBase(e.target.value)}
          >
            {[
              ...app.versions.map((v) => ({ slug: v.slug, title: v.title })),
              ...(primary && !app.versions.some((v) => v.slug === primary.slug)
                ? [{ slug: primary.slug, title: `${primary.title} (primary)` }]
                : []),
            ].map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.title}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              start(async () => {
                const r = await newVersionForAction(app.id, base || null);
                if (!r.ok) return void toast.error(r.error);
                router.push(`/dashboard/cv/${r.data.slug}`);
              })
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            New version
          </Button>
        </div>
        {primary && app.sentCv?.slug !== primary.slug ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => act(() => setSentCvAction(app.id, primary.slug))}
          >
            <Send className="mr-1 h-3.5 w-3.5" />
            Sent the primary CV as is
          </Button>
        ) : null}
        {unlinked.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Existing version"
              className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
              value={pick}
              onChange={(e) => setPick(e.target.value)}
            >
              {unlinked.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.title}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || !pick}
              onClick={() => act(() => linkVersionAction(app.id, pick, true))}
            >
              <Link2 className="mr-1 h-3.5 w-3.5" />
              Link existing
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Timeline({
  app,
  onChange,
}: {
  app: ApplicationDetail;
  onChange: (a: ApplicationDetail) => void;
}) {
  const [busy, start] = useTransition();
  const now = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const [e, setE] = useState({
    kind: "interview" as EventKind,
    title: "",
    at: now(),
    notes: "",
  });

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h2 className="font-semibold">Timeline</h2>
      <form
        className="space-y-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          start(async () => {
            const r = await addEventAction(app.id, {
              kind: e.kind,
              title: e.title,
              at: new Date(e.at).toISOString(),
              notes: e.notes,
            });
            if (!r.ok) return void toast.error(r.error);
            onChange(r.data);
            setE({ ...e, title: "", notes: "", at: now() });
          });
        }}
      >
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Event type"
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            value={e.kind}
            onChange={(x) => setE({ ...e, kind: x.target.value as EventKind })}
          >
            {EVENT_KINDS.filter((k) => k !== "stage").map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <input
            aria-label="Date and time"
            type="datetime-local"
            className="h-9 min-w-0 rounded-md border border-border bg-background px-2 text-sm"
            value={e.at}
            onChange={(x) => setE({ ...e, at: x.target.value })}
          />
        </div>
        <input
          aria-label="Event title"
          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
          placeholder="HR interview, user interview round 2, online test"
          value={e.title}
          onChange={(x) => setE({ ...e, title: x.target.value })}
        />
        <Textarea
          aria-label="Event notes"
          rows={2}
          placeholder="Notes (questions asked, next steps)"
          value={e.notes}
          onChange={(x) => setE({ ...e, notes: x.target.value })}
        />
        <Button size="sm" type="submit" disabled={busy || !e.title.trim()}>
          {busy ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="mr-1 h-3.5 w-3.5" />
          )}
          Add to timeline
        </Button>
      </form>

      <ol className="space-y-3 border-l border-border pl-4">
        {app.events.map((ev) => (
          <li key={ev.id} className="relative text-sm">
            <span
              className={cn(
                "absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                ev.kind === "stage" ? "bg-primary" : "bg-muted-foreground",
              )}
            />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium">{ev.title}</div>
                <div className="text-xs text-muted-foreground">
                  {KIND_LABEL[ev.kind as EventKind] ?? ev.kind} · {when(ev.at)}
                </div>
                {ev.notes ? (
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {ev.notes}
                  </p>
                ) : null}
              </div>
              {ev.kind !== "stage" ? (
                <button
                  type="button"
                  aria-label={`Delete ${ev.title}`}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={busy}
                  onClick={() =>
                    start(async () => {
                      const r = await deleteEventAction(app.id, ev.id);
                      if (!r.ok) return void toast.error(r.error);
                      onChange(r.data);
                    })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function BrainPanel({
  app,
  brain,
}: {
  app: ApplicationDetail;
  brain: boolean;
}) {
  const [busy, start] = useTransition();
  const [path, setPath] = useState(app.brainNotePath);
  return (
    <section className="space-y-2 rounded-lg border border-border bg-card p-4 text-sm">
      <h2 className="font-semibold">Second brain</h2>
      <p className="text-xs text-muted-foreground">
        Each stage change is added to this application&apos;s note: company,
        role, stage, source, job link, CV link and ATS score. No contacts,
        salary or job description.
      </p>
      {!brain ? (
        <p className="text-muted-foreground">
          Not configured. Set BRAIN_MCP_URL and BRAIN_MCP_TOKEN in the manager
          to turn it on.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {path ? (
            <code className="min-w-0 break-all text-xs">{path}</code>
          ) : (
            <span className="text-muted-foreground">No note yet.</span>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              start(async () => {
                const r = await syncBrainAction(app.id);
                if (!r.ok) return void toast.error(r.error);
                setPath(r.data.path);
                toast.success("Brain note updated");
              })
            }
          >
            {busy ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <BookOpen className="mr-1 h-3.5 w-3.5" />
            )}
            Sync now
          </Button>
        </div>
      )}
    </section>
  );
}

function DeleteApplication({
  id,
  onDeleted,
}: {
  id: string;
  onDeleted: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Button
        variant={armed ? "destructive" : "ghost"}
        size="sm"
        disabled={busy}
        onClick={() => {
          if (!armed) return setArmed(true);
          start(async () => {
            const r = await deleteApplicationAction(id);
            if (!r.ok) return void toast.error(r.error);
            onDeleted();
          });
        }}
        onBlur={() => setArmed(false)}
      >
        <Trash2 className="mr-1 h-3.5 w-3.5" />
        {armed ? "Click again to delete" : "Delete application"}
      </Button>
      {armed ? (
        <span className="text-xs text-muted-foreground">
          Its CV versions are kept.
        </span>
      ) : null}
    </div>
  );
}
