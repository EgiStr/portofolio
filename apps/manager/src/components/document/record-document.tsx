"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { cn } from "@ecosystem/ui";
import {
  createRecordAction,
  deleteRowAction,
  type DocResource,
} from "@/actions/content";
import {
  display,
  Editor,
  isLocked,
  type Column,
} from "@/components/database/fields";
import { ImageUpload } from "@/components/upload/image-upload";
import { FileUpload } from "@/components/upload/file-upload";
import { isConflict, makeSaver } from "@/lib/record-saver";

// The block editor touches the DOM on load, so it never renders on the server.
const PostBody = dynamic(() => import("./post-body"), {
  ssr: false,
  loading: () => (
    <p className="text-sm text-muted-foreground">Loading editor</p>
  ),
});

export type Section =
  | { kind: "text"; key: string; label: string; placeholder?: string }
  | {
      kind: "image";
      key: string;
      label: string;
      bucket: "projects" | "avatars" | "blog";
      aspect: "video" | "square" | "banner";
    }
  | { kind: "file"; key: string; label: string; bucket: "certificates" }
  | { kind: "markdown"; key: string; label: string; bucket: "blog" }
  | {
      kind: "skills";
      label: string;
      options: { value: string; label: string }[];
    };

type Props = {
  resource: DocResource;
  /** null renders the create form for a new record. */
  id: string | null;
  updatedAt: string | null;
  listHref: string;
  titleKey: string;
  titlePlaceholder: string;
  properties: Column[];
  sections?: Section[];
  values: Record<string, unknown>;
  /** Keys that must be filled before a new record can be created. */
  required: string[];
};

type Status =
  | { kind: "idle" | "saving" | "saved" }
  | { kind: "error"; message: string; conflict: boolean };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const filled = (v: unknown) =>
  v !== null && v !== undefined && String(v).trim() !== "";

export function RecordDocument({
  resource,
  id,
  updatedAt,
  listHref,
  titleKey,
  titlePlaceholder,
  properties,
  sections = [],
  values: initial,
  required,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const creating = id === null;
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  // Fields stay locked while a reload is in flight, so no edit lands on the old version.
  const [reloading, startReload] = useTransition();
  const slugTouched = useRef(!creating);
  const pending = useRef(0);
  const saver = useMemo(() => makeSaver(resource), [resource]);
  /** What the server last accepted, so a blur with no change sends nothing. */
  const saved = useRef(initial);
  /** Bumped with each reset so the post editor remounts on the fresh text. */
  const [generation, setGeneration] = useState(0);
  const mounted = useRef(false);

  // Fresh props arrive after router.refresh() (the Reload on a conflict).
  useEffect(() => {
    setValues(initial);
    saved.current = initial;
    if (id) saver.reset(id, updatedAt);
    setStatus({ kind: "idle" });
    if (mounted.current) setGeneration((g) => g + 1);
    mounted.current = true;
  }, [initial, id, updatedAt, saver]);

  const title = String(values[titleKey] ?? "");
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("manager-crumb", {
        detail: { path: pathname, title: title || "Untitled" },
      }),
    );
  }, [pathname, title]);

  function set(key: string, value: unknown) {
    setValues((v) => {
      const next = { ...v, [key]: value };
      if (creating && key === titleKey && "slug" in v && !slugTouched.current)
        next.slug = slugify(String(value ?? ""));
      if (key === "slug") slugTouched.current = true;
      return next;
    });
  }

  async function commit(key: string, value: unknown) {
    setEditing(null);
    set(key, value);
    if (creating) return;
    const before = saved.current[key];
    if (JSON.stringify(before ?? null) === JSON.stringify(value ?? null))
      return;
    saved.current = { ...saved.current, [key]: value };
    pending.current++;
    setStatus({ kind: "saving" });
    const res = await saver.save(id!, { [key]: value });
    pending.current--;
    if (res.ok) {
      if (pending.current === 0)
        setStatus((s) => (s.kind === "error" ? s : { kind: "saved" }));
      return;
    }
    saved.current = { ...saved.current, [key]: before };
    setStatus({
      kind: "error",
      message: res.error,
      conflict: isConflict(res.error),
    });
  }

  async function create() {
    setBusy(true);
    const res = await createRecordAction(resource, values);
    if (!res.ok) {
      setBusy(false);
      return void toast.error(res.error);
    }
    toast.success("Created");
    router.replace(`${listHref}/${res.data.id}/edit`);
  }

  async function remove() {
    if (!confirmDelete) return setConfirmDelete(true);
    setBusy(true);
    const res = await deleteRowAction(resource, id!);
    if (!res.ok) {
      setBusy(false);
      setConfirmDelete(false);
      return void toast.error(res.error);
    }
    toast.success("Deleted");
    router.push(listHref);
  }

  const missing = required.filter((k) => !filled(values[k]));
  const labelFor = (k: string) =>
    k === titleKey
      ? "title"
      : (properties.find((p) => p.key === k)?.label.toLowerCase() ?? k);

  return (
    <article className="mx-auto max-w-[720px] pb-24">
      <div
        className="mb-8 flex min-h-8 items-center justify-end gap-2 text-xs text-muted-foreground"
        aria-live="polite"
      >
        {creating ? (
          <span>
            {missing.length
              ? `Needs ${missing.map(labelFor).join(", ")}`
              : "Ready to create"}
          </span>
        ) : reloading ? (
          <span>Loading the latest version</span>
        ) : status.kind === "error" ? (
          <span className="flex items-center gap-2 text-destructive">
            {status.conflict
              ? "Changed somewhere else. Your last edit was not saved."
              : `Not saved. ${status.message}`}
            {status.conflict && (
              <button
                onClick={() => startReload(() => router.refresh())}
                disabled={reloading}
                className="rounded-md border border-destructive/40 px-2 py-1 text-foreground hover:bg-accent"
              >
                Reload
              </button>
            )}
          </span>
        ) : (
          <span>
            {status.kind === "saving"
              ? "Saving"
              : status.kind === "saved"
                ? "Saved"
                : "Edits save on their own"}
          </span>
        )}
        {!creating && (
          <button
            onClick={remove}
            onBlur={() => setConfirmDelete(false)}
            disabled={busy}
            className={cn(
              "rounded-md px-2 py-1",
              confirmDelete
                ? "bg-destructive text-destructive-foreground"
                : "hover:bg-accent hover:text-destructive",
            )}
          >
            {confirmDelete ? "Delete permanently?" : "Delete"}
          </button>
        )}
      </div>

      <fieldset
        disabled={reloading || busy}
        className="min-w-0 disabled:opacity-60"
      >
        <TitleInput
          value={title}
          placeholder={titlePlaceholder}
          onChange={(v) => set(titleKey, v)}
          onCommit={(v) => commit(titleKey, v.trim() || values[titleKey])}
        />

        <dl className="mt-6 space-y-0.5 border-b pb-6">
          {properties.map((p) => (
            <div
              key={p.key}
              className="grid grid-cols-[minmax(7rem,10rem)_1fr] items-start gap-2 text-sm"
            >
              <dt className="flex min-h-9 items-center text-muted-foreground">
                {p.label}
                {creating && required.includes(p.key) && (
                  <span className="sr-only"> (required)</span>
                )}
              </dt>
              <dd className="relative min-h-9 min-w-0">
                {editing === p.key ? (
                  <Editor
                    column={p}
                    value={values[p.key]}
                    onCommit={(v) => commit(p.key, v)}
                    onCancel={() => setEditing(null)}
                  />
                ) : p.type === "checkbox" ? (
                  <label className="flex min-h-9 items-center px-2">
                    <input
                      type="checkbox"
                      checked={Boolean(values[p.key])}
                      onChange={(e) => commit(p.key, e.target.checked)}
                      className="h-4 w-4 rounded border-input accent-primary"
                      aria-label={p.label}
                    />
                  </label>
                ) : (
                  <button
                    onClick={() => !isLocked(p) && setEditing(p.key)}
                    disabled={isLocked(p)}
                    className={cn(
                      "flex min-h-9 w-full items-center rounded-md px-2 py-1.5 text-left",
                      !isLocked(p) && "hover:bg-accent",
                      p.mono && "font-mono text-xs",
                    )}
                    aria-label={`${p.label}: edit`}
                  >
                    {display(p, values[p.key])}
                  </button>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 space-y-10">
          {sections.map((s) => (
            <section
              key={s.kind === "skills" ? "skills" : s.key}
              className="space-y-3"
            >
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </h2>
              {s.kind === "text" && (
                <BodyText
                  value={String(values[s.key] ?? "")}
                  placeholder={s.placeholder}
                  label={s.label}
                  live={creating}
                  onCommit={(v) => commit(s.key, v.trim() ? v : null)}
                />
              )}
              {s.kind === "markdown" && (
                <PostBody
                  key={generation}
                  value={String(values[s.key] ?? "")}
                  bucket={s.bucket}
                  live={creating}
                  locked={reloading || busy}
                  onCommit={(md) => commit(s.key, md)}
                />
              )}
              {s.kind === "image" && (
                <ImageUpload
                  value={String(values[s.key] ?? "")}
                  onChange={(url) => commit(s.key, url || null)}
                  bucket={s.bucket}
                  aspectRatio={s.aspect}
                  label=""
                />
              )}
              {s.kind === "file" && (
                <FileUpload
                  value={String(values[s.key] ?? "")}
                  onChange={(url) => commit(s.key, url || null)}
                  bucket={s.bucket}
                  maxSize={10}
                  label=""
                />
              )}
              {s.kind === "skills" && (
                <SkillPicker
                  value={(values.skillIds as string[]) ?? []}
                  options={s.options}
                  onChange={(ids) => commit("skillIds", ids)}
                />
              )}
            </section>
          ))}
        </div>
      </fieldset>

      {creating && (
        <div className="mt-10 flex justify-end">
          <button
            onClick={create}
            disabled={busy || missing.length > 0}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Creating" : "Create"}
          </button>
        </div>
      )}
    </article>
  );
}

function TitleInput({
  value,
  placeholder,
  onChange,
  onCommit,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
}) {
  return (
    <textarea
      value={value}
      rows={1}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
      onBlur={(e) => onCommit(e.target.value)}
      onKeyDown={(e) =>
        e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())
      }
      aria-label="Title"
      className="w-full resize-none overflow-hidden bg-transparent font-serif text-[36px] font-semibold leading-tight tracking-tight outline-none [field-sizing:content] placeholder:text-muted-foreground/50"
    />
  );
}

/** live: report every keystroke (create form), otherwise save on blur. */
function BodyText({
  value,
  placeholder,
  label,
  live,
  onCommit,
}: {
  value: string;
  placeholder?: string;
  label: string;
  live?: boolean;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <textarea
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (live) onCommit(e.target.value);
      }}
      onBlur={() => !live && draft !== value && onCommit(draft)}
      placeholder={placeholder ?? "Empty"}
      aria-label={label}
      className="min-h-24 w-full resize-none overflow-hidden rounded-md bg-transparent text-[15px] leading-relaxed outline-none [field-sizing:content] placeholder:text-muted-foreground/60 focus:bg-accent/40"
    />
  );
}

function SkillPicker({
  value,
  options,
  onChange,
}: {
  value: string[];
  options: { value: string; label: string }[];
  onChange: (ids: string[]) => void;
}) {
  const rest = options.filter((o) => !value.includes(o.value));
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.map((id) => (
        <span
          key={id}
          className="inline-flex items-center gap-1 rounded bg-accent py-0.5 pl-2 pr-1 text-xs"
        >
          {options.find((o) => o.value === id)?.label ?? "Unknown skill"}
          <button
            onClick={() => onChange(value.filter((v) => v !== id))}
            className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label={`Remove ${options.find((o) => o.value === id)?.label ?? "skill"}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {rest.length > 0 && (
        <label className="relative inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Add skill
          <select
            value=""
            onChange={(e) =>
              e.target.value && onChange([...value, e.target.value])
            }
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Add skill"
          >
            <option value="">Add skill</option>
            {rest.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
