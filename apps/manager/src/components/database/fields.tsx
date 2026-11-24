"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@ecosystem/ui";

export type Tone = "accent" | "neutral" | "danger";
export type Option = { value: string; label: string; tone?: Tone };

export type Column = {
  key: string;
  label: string;
  type:
    | "text"
    | "number"
    | "select"
    | "date"
    | "checkbox"
    | "tags"
    | "url"
    | "readonly";
  options?: Option[];
  /** Tailwind width class for the column. */
  width?: string;
  /** The title column links to the record page. */
  primary?: boolean;
  /** Value written when a cell is cleared; null by default, undefined means "required". */
  required?: boolean;
  min?: number;
  max?: number;
  /** Shown with its type's formatting but never edited (counts, timestamps). */
  locked?: boolean;
  /** Monospace display, for slugs and ids. */
  mono?: boolean;
};

export const isLocked = (c: Column) => c.type === "readonly" || !!c.locked;

const toneClass: Record<Tone, string> = {
  accent: "bg-primary-soft text-foreground",
  neutral: "bg-accent text-muted-foreground",
  danger: "bg-destructive/10 text-destructive",
};

export function Pill({ option }: { option?: Option }) {
  if (!option) return <span className="text-muted-foreground">Empty</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs",
        toneClass[option.tone ?? "neutral"],
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          option.tone === "accent"
            ? "bg-primary"
            : option.tone === "danger"
              ? "bg-destructive"
              : "bg-muted-foreground",
        )}
        aria-hidden
      />
      {option.label}
    </span>
  );
}

export function display(col: Column, v: unknown) {
  if (
    v === null ||
    v === undefined ||
    v === "" ||
    (Array.isArray(v) && v.length === 0)
  ) {
    return col.type === "checkbox" ? null : (
      <span className="text-muted-foreground/70">Empty</span>
    );
  }
  switch (col.type) {
    case "select":
      return <Pill option={col.options?.find((o) => o.value === v)} />;
    case "date":
      return new Date(String(v)).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    case "tags":
      return (
        <span
          className="flex min-w-0 items-center gap-1 overflow-hidden"
          title={(v as string[]).join(", ")}
        >
          {(v as string[]).slice(0, 3).map((t) => (
            <span
              key={t}
              className="shrink-0 whitespace-nowrap rounded bg-accent px-1.5 py-0.5 text-xs"
            >
              {t}
            </span>
          ))}
          {(v as string[]).length > 3 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              +{(v as string[]).length - 3}
            </span>
          )}
        </span>
      );
    case "url":
      return (
        <span className="truncate font-mono text-xs text-muted-foreground">
          {String(v).replace(/^https?:\/\//, "")}
        </span>
      );
    case "number":
      return <span className="tabular-nums">{String(v)}</span>;
    default:
      return <span className="line-clamp-2">{String(v)}</span>;
  }
}

export function Editor({
  column: c,
  value,
  onCommit,
  onCancel,
}: {
  column: Column;
  value: unknown;
  onCommit: (v: unknown) => void;
  onCancel: () => void;
}) {
  const committed = useRef(false);
  const commit = (v: unknown) => {
    if (committed.current) return;
    committed.current = true;
    onCommit(v);
  };
  const base =
    "absolute inset-x-0 top-0 z-20 min-h-10 w-full rounded-md border border-ring bg-card px-2 text-sm shadow-lg outline-none";

  if (c.type === "select") {
    return (
      <select
        autoFocus
        defaultValue={String(value ?? "")}
        onChange={(e) => commit(e.target.value || (c.required ? value : null))}
        onBlur={onCancel}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        className={base}
        aria-label={c.label}
      >
        {!c.required && <option value="">Empty</option>}
        {c.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  const initial =
    c.type === "tags"
      ? ((value as string[] | null) ?? []).join(", ")
      : c.type === "date"
        ? value
          ? String(value).slice(0, 10)
          : ""
        : String(value ?? "");
  const parse = (raw: string): unknown => {
    const t = raw.trim();
    if (!t) return c.type === "tags" ? [] : c.required ? value : null;
    if (c.type === "tags")
      return [
        ...new Set(
          t
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ];
    if (c.type === "number") {
      const n = Number(t);
      if (!Number.isFinite(n)) return value;
      return Math.round(
        Math.min(c.max ?? Infinity, Math.max(c.min ?? -Infinity, n)),
      );
    }
    if (c.type === "date") return new Date(t).toISOString();
    return t;
  };

  return (
    <div className={cn(base, "flex items-center gap-1 p-0 pl-2")}>
      <input
        autoFocus
        type={
          c.type === "number" ? "number" : c.type === "date" ? "date" : "text"
        }
        defaultValue={initial}
        min={c.min}
        max={c.max}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(parse(e.currentTarget.value));
          if (e.key === "Escape") onCancel();
        }}
        onBlur={(e) => commit(parse(e.currentTarget.value))}
        placeholder={c.type === "tags" ? "Comma separated" : undefined}
        className="h-10 min-w-0 flex-1 bg-transparent outline-none"
        aria-label={c.label}
      />
      <Check
        className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
