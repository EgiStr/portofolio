"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarClock,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Badge, Button, Input, Label, Textarea, cn } from "@ecosystem/ui";
import {
  ACTIVE_STAGES,
  CLOSED_STAGES,
  STAGE_LABEL,
  STAGES,
  isClosed,
  isOverdue,
  pipelineCounts,
  type Stage,
} from "@ecosystem/cv-core";
import {
  createApplicationAction,
  moveStageAction,
} from "@/actions/applications";

export interface BoardCard {
  id: string;
  company: string;
  role: string;
  location: string | null;
  source: string | null;
  stage: Stage;
  appliedAt: string | null;
  followUpAt: string | null;
  updatedAt: string;
  sentCv: { slug: string; title: string; atsScore: number | null } | null;
  versionCount: number;
  bestAts: number | null;
  lastEvent: { title: string; at: string } | null;
}

type Base = { slug: string; title: string; isPrimary: boolean };

export const SOURCES = [
  "LinkedIn",
  "Glints",
  "Jobstreet",
  "Kalibrr",
  "Company site",
  "Referral",
  "Recruiter",
  "Other",
];

const day = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

export function TrackerBoard({
  initial,
  bases,
  openNew = false,
}: {
  initial: BoardCard[];
  bases: Base[];
  openNew?: boolean;
}) {
  const [cards, setCards] = useState(initial);
  const [view, setView] = useState<"board" | "list">("board");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(openNew || initial.length === 0);
  const [dragId, setDragId] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? cards.filter((c) =>
          `${c.company} ${c.role} ${c.source ?? ""} ${c.location ?? ""}`
            .toLowerCase()
            .includes(q),
        )
      : cards;
  }, [cards, query]);
  const counts = pipelineCounts(cards);

  async function move(id: string, stage: Stage) {
    const before = cards;
    const card = cards.find((c) => c.id === id);
    if (!card || card.stage === stage) return;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, stage } : c)));
    const r = await moveStageAction(id, stage);
    if (!r.ok) {
      setCards(before);
      return void toast.error(r.error);
    }
    setCards((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              appliedAt: r.data.appliedAt
                ? new Date(r.data.appliedAt).toISOString()
                : null,
              updatedAt: new Date(r.data.updatedAt).toISOString(),
            }
          : c,
      ),
    );
    toast.success(`${card.company}: ${STAGE_LABEL[stage]}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Tracker</h1>
          <p className="text-muted-foreground">
            Every application with its stage, timeline and the CV versions
            tailored for it. Drag a card to move it.
          </p>
        </div>
        <Button onClick={() => setShowNew((s) => !s)}>
          {showNew ? (
            <X className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {showNew ? "Close" : "New application"}
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Open", counts.open],
          ["Interviewing", counts.byStage.INTERVIEW],
          ["Offers", counts.byStage.OFFER + counts.byStage.ACCEPTED],
          ["Follow-up overdue", counts.overdue],
        ].map(([label, n]) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-3"
          >
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd
              className={cn(
                "text-2xl font-semibold tabular-nums",
                label === "Follow-up overdue" &&
                  Number(n) > 0 &&
                  "text-destructive",
              )}
            >
              {n}
            </dd>
          </div>
        ))}
      </dl>

      {showNew ? <NewApplicationForm bases={bases} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search company, role, source"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search applications"
          />
        </div>
        <div
          className="flex rounded-md border border-border p-0.5"
          role="group"
          aria-label="View"
        >
          <Button
            size="sm"
            variant={view === "board" ? "secondary" : "ghost"}
            onClick={() => setView("board")}
            aria-pressed={view === "board"}
          >
            <LayoutGrid className="mr-1.5 h-4 w-4" />
            Board
          </Button>
          <Button
            size="sm"
            variant={view === "list" ? "secondary" : "ghost"}
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            <List className="mr-1.5 h-4 w-4" />
            List
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          {counts.total} total
        </span>
      </div>

      {view === "board" ? (
        <div className="-mx-1 overflow-x-auto pb-2">
          <div className="grid min-w-[66rem] grid-cols-7 gap-2 px-1">
            {ACTIVE_STAGES.map((stage) => (
              <Column
                key={stage}
                title={STAGE_LABEL[stage]}
                count={shown.filter((c) => c.stage === stage).length}
                onDrop={() => dragId && move(dragId, stage)}
              >
                {shown
                  .filter((c) => c.stage === stage)
                  .map((c) => (
                    <Card
                      key={c.id}
                      card={c}
                      onMove={move}
                      onDrag={setDragId}
                    />
                  ))}
              </Column>
            ))}
            <Column
              title="Closed"
              count={shown.filter((c) => isClosed(c.stage)).length}
            >
              <div className="grid grid-cols-1 gap-1 xl:grid-cols-2">
                {CLOSED_STAGES.map((s) => (
                  <DropZone
                    key={s}
                    label={STAGE_LABEL[s]}
                    onDrop={() => dragId && move(dragId, s)}
                  />
                ))}
              </div>
              {shown
                .filter((c) => isClosed(c.stage))
                .map((c) => (
                  <Card key={c.id} card={c} onMove={move} onDrag={setDragId} />
                ))}
            </Column>
          </div>
        </div>
      ) : (
        <ListView cards={shown} onMove={move} />
      )}
    </div>
  );
}

function Column({
  title,
  count,
  onDrop,
  children,
}: {
  title: string;
  count: number;
  onDrop?: () => void;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  return (
    <section
      className={cn(
        "flex min-h-40 min-w-0 flex-col gap-2 rounded-lg border border-border bg-muted/30 p-2",
        over && "border-primary bg-primary/5",
      )}
      onDragOver={(e) => {
        if (!onDrop) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onDrop?.();
      }}
      aria-label={`${title}, ${count}`}
    >
      <h2 className="flex items-center justify-between px-1 text-sm font-semibold">
        {title}
        <span className="rounded bg-background px-1.5 text-xs tabular-nums text-muted-foreground">
          {count}
        </span>
      </h2>
      {children}
    </section>
  );
}

function DropZone({ label, onDrop }: { label: string; onDrop: () => void }) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={cn(
        "rounded border border-dashed border-border px-1 py-1.5 text-center text-[11px] text-muted-foreground",
        over && "border-primary text-foreground",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        onDrop();
      }}
    >
      {label}
    </div>
  );
}

function StageSelect({
  value,
  onChange,
  className,
}: {
  value: Stage;
  onChange: (s: Stage) => void;
  className?: string;
}) {
  return (
    <select
      aria-label="Stage"
      className={cn(
        "h-8 rounded-md border border-border bg-background px-1.5 text-xs",
        className,
      )}
      value={value}
      onChange={(e) => onChange(e.target.value as Stage)}
    >
      {STAGES.map((s) => (
        <option key={s} value={s}>
          {STAGE_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

function Card({
  card: c,
  onMove,
  onDrag,
}: {
  card: BoardCard;
  onMove: (id: string, s: Stage) => void;
  onDrag: (id: string | null) => void;
}) {
  const overdue = isOverdue(c.followUpAt, c.stage);
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDrag(c.id);
      }}
      onDragEnd={() => onDrag(null)}
      className="cursor-grab space-y-2 rounded-md border border-border bg-card p-2.5 text-sm shadow-sm active:cursor-grabbing"
    >
      <Link href={`/dashboard/applications/${c.id}`} className="block min-w-0">
        <div className="truncate font-semibold hover:underline">
          {c.company}
        </div>
        <div className="truncate text-muted-foreground">{c.role}</div>
      </Link>
      <div className="flex flex-wrap gap-1">
        {isClosed(c.stage) ? (
          <Badge variant="outline">{STAGE_LABEL[c.stage]}</Badge>
        ) : null}
        {c.source ? <Badge variant="secondary">{c.source}</Badge> : null}
        {c.sentCv ? (
          <Badge variant="outline" title={`Sent: ${c.sentCv.title}`}>
            <FileText className="mr-1 h-3 w-3" />
            CV sent
            {c.sentCv.atsScore != null ? ` · ATS ${c.sentCv.atsScore}` : ""}
          </Badge>
        ) : c.versionCount ? (
          <Badge variant="outline">
            {c.versionCount} CV{c.versionCount > 1 ? "s" : ""}
            {c.bestAts != null ? ` · ATS ${c.bestAts}` : ""}
          </Badge>
        ) : null}
      </div>
      {c.followUpAt ? (
        <div
          className={cn(
            "flex items-center gap-1 text-xs",
            overdue ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          {overdue ? "Overdue: " : "Follow up "}
          {day(c.followUpAt)}
        </div>
      ) : c.appliedAt ? (
        <div className="text-xs text-muted-foreground">
          Applied {day(c.appliedAt)}
        </div>
      ) : null}
      <StageSelect
        value={c.stage}
        onChange={(s) => onMove(c.id, s)}
        className="w-full"
      />
    </article>
  );
}

function ListView({
  cards,
  onMove,
}: {
  cards: BoardCard[];
  onMove: (id: string, s: Stage) => void;
}) {
  if (!cards.length)
    return (
      <p className="text-sm text-muted-foreground">No applications match.</p>
    );
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-muted-foreground">
          <tr>
            <th className="p-3 font-medium">Application</th>
            <th className="p-3 font-medium">Stage</th>
            <th className="p-3 font-medium">Source</th>
            <th className="p-3 font-medium">Applied</th>
            <th className="p-3 font-medium">Follow-up</th>
            <th className="p-3 font-medium">CV</th>
            <th className="p-3 font-medium">Last activity</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((c) => (
            <tr key={c.id} className="border-b border-border last:border-0">
              <td className="p-3">
                <Link
                  href={`/dashboard/applications/${c.id}`}
                  className="font-medium hover:underline"
                >
                  {c.company}
                </Link>
                <div className="text-xs text-muted-foreground">{c.role}</div>
              </td>
              <td className="p-3">
                <StageSelect
                  value={c.stage}
                  onChange={(s) => onMove(c.id, s)}
                />
              </td>
              <td className="p-3">{c.source ?? "None"}</td>
              <td className="whitespace-nowrap p-3">
                {day(c.appliedAt) ?? "Not yet"}
              </td>
              <td
                className={cn(
                  "whitespace-nowrap p-3",
                  isOverdue(c.followUpAt, c.stage) &&
                    "font-medium text-destructive",
                )}
              >
                {day(c.followUpAt) ?? "None"}
              </td>
              <td className="p-3">
                {c.sentCv ? (
                  <Link
                    className="hover:underline"
                    href={`/dashboard/cv/${c.sentCv.slug}`}
                  >
                    Sent
                    {c.sentCv.atsScore != null
                      ? `, ATS ${c.sentCv.atsScore}`
                      : ""}
                  </Link>
                ) : c.versionCount ? (
                  `${c.versionCount} draft${c.versionCount > 1 ? "s" : ""}`
                ) : (
                  "None"
                )}
              </td>
              <td className="p-3 text-muted-foreground">
                {c.lastEvent ? (
                  <>
                    {c.lastEvent.title}
                    <div className="text-xs">{day(c.lastEvent.at)}</div>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewApplicationForm({ bases }: { bases: Base[] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [f, setF] = useState({
    company: "",
    role: "",
    location: "",
    source: "",
    jobUrl: "",
    jobDescription: "",
    stage: "WISHLIST" as Stage,
    createCv: true,
    cvBaseSlug: bases.find((b) => b.isPrimary)?.slug ?? bases[0]?.slug ?? "",
  });
  const set =
    (k: keyof typeof f) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setF({ ...f, [k]: e.target.value });

  return (
    <form
      className="space-y-3 rounded-lg border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await createApplicationAction({
            ...f,
            cvBaseSlug: f.cvBaseSlug || null,
          });
          if (!r.ok) return void toast.error(r.error);
          router.push(`/dashboard/applications/${r.data.id}`);
        });
      }}
    >
      <h2 className="font-semibold">New application</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          id="na-company"
          label="Company"
          required
          value={f.company}
          onChange={set("company")}
        />
        <Field
          id="na-role"
          label="Role"
          required
          value={f.role}
          onChange={set("role")}
        />
        <Field
          id="na-location"
          label="Location"
          value={f.location}
          onChange={set("location")}
          placeholder="Jakarta, remote"
        />
        <div className="space-y-1">
          <Label htmlFor="na-source">Source</Label>
          <Input
            id="na-source"
            list="job-sources"
            value={f.source}
            onChange={set("source")}
          />
          <datalist id="job-sources">
            {SOURCES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <Field
          id="na-url"
          label="Job posting link"
          type="url"
          value={f.jobUrl}
          onChange={set("jobUrl")}
          placeholder="https://"
        />
        <div className="space-y-1">
          <Label htmlFor="na-stage">Stage</Label>
          <select
            id="na-stage"
            className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
            value={f.stage}
            onChange={set("stage")}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="na-jd">Job description</Label>
        <Textarea
          id="na-jd"
          rows={4}
          value={f.jobDescription}
          onChange={set("jobDescription")}
          placeholder="Paste it here so the CV version can be scored against it."
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.createCv}
            onChange={(e) => setF({ ...f, createCv: e.target.checked })}
          />
          Create a tailored CV version from
        </label>
        <select
          aria-label="Base CV"
          disabled={!f.createCv}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-50"
          value={f.cvBaseSlug}
          onChange={set("cvBaseSlug")}
        >
          {bases.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.title}
              {b.isPrimary ? " (primary)" : ""}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="submit"
        disabled={busy || !f.company.trim() || !f.role.trim()}
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        Add application
      </Button>
    </form>
  );
}

export function Field({
  id,
  label,
  hint,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="min-w-0 space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
