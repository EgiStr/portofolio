"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  ListFilter,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@ecosystem/ui";
import {
  createSkillAction,
  deleteRowAction,
  saveCellAction,
  type Resource,
} from "@/actions/content";

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
};

const isLocked = (c: Column) => c.type === "readonly" || !!c.locked;

export type Row = {
  id: string;
  updatedAt: string | null;
  href?: string;
  values: Record<string, unknown>;
};

type Props = {
  resource: Resource;
  title: string;
  description?: string;
  columns: Column[];
  rows: Row[];
  newHref?: string;
  newLabel: string;
  /** Column keys that make sense to group by. */
  groupable?: string[];
  defaultGroup?: string;
  defaultSort?: { key: string; dir: "asc" | "desc" };
};

const toneClass: Record<Tone, string> = {
  accent: "bg-primary-soft text-foreground",
  neutral: "bg-accent text-muted-foreground",
  danger: "bg-destructive/10 text-destructive",
};

function Pill({ option }: { option?: Option }) {
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

function display(col: Column, v: unknown) {
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

function compare(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean") return Number(b) - Number(a);
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function DataTable({
  resource,
  title,
  description,
  columns,
  rows: initial,
  newHref,
  newLabel,
  groupable = [],
  defaultGroup,
  defaultSort,
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(defaultSort ?? null);
  const [group, setGroup] = useState(defaultGroup ?? "");
  const [filter, setFilter] = useState<{ key: string; value: string } | null>(
    null,
  );
  const [editing, setEditing] = useState<{ id: string; key: string } | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [, start] = useTransition();
  const filterable = columns.filter(
    (c) => c.type === "select" || c.type === "checkbox",
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    let out = rows.filter(
      (r) =>
        !term ||
        columns.some((c) =>
          String(r.values[c.key] ?? "")
            .toLowerCase()
            .includes(term),
        ),
    );
    if (filter)
      out = out.filter(
        (r) => String(r.values[filter.key] ?? "") === filter.value,
      );
    if (sort)
      out = [...out].sort(
        (a, b) =>
          compare(a.values[sort.key], b.values[sort.key]) *
          (sort.dir === "asc" ? 1 : -1),
      );
    return out;
  }, [rows, query, filter, sort, columns]);

  const groups = useMemo(() => {
    const col = columns.find((c) => c.key === group);
    if (!col)
      return [{ key: "", label: null as React.ReactNode, rows: visible }];
    const order =
      col.options?.map((o) => o.value) ??
      (col.type === "checkbox" ? ["true", "false"] : []);
    const map = new Map<string, Row[]>();
    for (const r of visible) {
      const k = String(r.values[group] ?? "");
      map.set(k, [...(map.get(k) ?? []), r]);
    }
    return [...map.entries()]
      .sort(
        ([a], [b]) =>
          (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
          (order.indexOf(b) === -1 ? 99 : order.indexOf(b)),
      )
      .map(([k, rs]) => ({
        key: k,
        label:
          col.type === "checkbox"
            ? k === "true"
              ? col.label
              : `Not ${col.label.toLowerCase()}`
            : (col.options?.find((o) => o.value === k)?.label ??
              (k || "Empty")),
        rows: rs,
      }));
  }, [visible, group, columns]);

  function save(row: Row, key: string, value: unknown) {
    const before = row.values[key];
    if (JSON.stringify(before) === JSON.stringify(value))
      return setEditing(null);
    setEditing(null);
    setRows((rs) =>
      rs.map((r) =>
        r.id === row.id ? { ...r, values: { ...r.values, [key]: value } } : r,
      ),
    );
    start(async () => {
      const res = await saveCellAction(resource, row.id, row.updatedAt, {
        [key]: value,
      });
      if (res.ok) {
        setRows((rs) =>
          rs.map((r) =>
            r.id === row.id ? { ...r, updatedAt: res.data.updatedAt } : r,
          ),
        );
        return;
      }
      setRows((rs) =>
        rs.map((r) =>
          r.id === row.id
            ? { ...r, values: { ...r.values, [key]: before } }
            : r,
        ),
      );
      const conflict = res.error.includes("changed since");
      toast.error(
        conflict ? "This row was changed somewhere else." : res.error,
        conflict
          ? { action: { label: "Reload", onClick: () => router.refresh() } }
          : undefined,
      );
    });
  }

  function remove(row: Row) {
    if (confirmDelete !== row.id) return setConfirmDelete(row.id);
    setConfirmDelete(null);
    const prev = rows;
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    start(async () => {
      const res = await deleteRowAction(resource, row.id);
      if (!res.ok) {
        setRows(prev);
        toast.error(res.error);
      } else toast.success("Deleted");
    });
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="max-w-[65ch] text-muted-foreground">{description}</p>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <label className="flex h-8 w-full min-w-0 items-center gap-2 rounded-md px-2 text-sm focus-within:bg-accent sm:w-auto sm:max-w-xs sm:flex-1">
          <Search
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label={`Search ${title}`}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {filterable.length > 0 && (
            <ChipSelect
              icon={<ListFilter className="h-3.5 w-3.5" />}
              label={
                filter
                  ? `${columns.find((c) => c.key === filter.key)?.label}: ${optionLabel(columns.find((c) => c.key === filter.key)!, filter.value)}`
                  : "Filter"
              }
              active={!!filter}
              value={filter ? `${filter.key}=${filter.value}` : ""}
              onChange={(v) =>
                setFilter(
                  v
                    ? {
                        key: v.split("=")[0],
                        value: v.split("=").slice(1).join("="),
                      }
                    : null,
                )
              }
              options={filterable.flatMap((c) =>
                (
                  c.options ?? [
                    { value: "true", label: "Yes" },
                    { value: "false", label: "No" },
                  ]
                ).map((o) => ({
                  value: `${c.key}=${o.value}`,
                  label: `${c.label}: ${o.label}`,
                })),
              )}
              clearLabel="No filter"
            />
          )}
          {groupable.length > 0 && (
            <ChipSelect
              label={
                group
                  ? `Group: ${columns.find((c) => c.key === group)?.label}`
                  : "Group"
              }
              active={!!group}
              value={group}
              onChange={setGroup}
              options={groupable.map((k) => ({
                value: k,
                label: columns.find((c) => c.key === k)?.label ?? k,
              }))}
              clearLabel="No grouping"
            />
          )}
          {sort && (
            <button
              onClick={() => setSort(null)}
              className="flex h-8 items-center gap-1 rounded-md bg-primary-soft px-2 text-xs"
            >
              {sort.dir === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )}
              {columns.find((c) => c.key === sort.key)?.label}
              <X
                className="h-3 w-3 text-muted-foreground"
                aria-label="Clear sort"
              />
            </button>
          )}
          {newHref && (
            <Link
              href={newHref}
              className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {newLabel}
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "p-0 text-left font-normal text-muted-foreground",
                    c.width,
                  )}
                  aria-sort={
                    sort?.key === c.key
                      ? sort.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <button
                    onClick={() =>
                      setSort((s) =>
                        s?.key === c.key
                          ? s.dir === "asc"
                            ? { key: c.key, dir: "desc" }
                            : null
                          : { key: c.key, dir: "asc" },
                      )
                    }
                    className="flex w-full items-center gap-1 px-2 py-2 text-xs hover:bg-accent"
                  >
                    {c.label}
                    {sort?.key === c.key &&
                      (sort.dir === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      ))}
                  </button>
                </th>
              ))}
              <th className="w-10" aria-label="Row actions" />
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.key}>
              {g.label !== null && (
                <tr>
                  <th
                    colSpan={columns.length + 1}
                    scope="rowgroup"
                    className="px-2 pb-1 pt-5 text-left text-xs font-medium"
                  >
                    {g.label}{" "}
                    <span className="ml-1 font-normal text-muted-foreground">
                      {g.rows.length}
                    </span>
                  </th>
                </tr>
              )}
              {g.rows.map((r) => (
                <tr key={r.id} className="group border-b hover:bg-accent/50">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn("relative h-10 p-0 align-middle", c.width)}
                    >
                      {editing?.id === r.id && editing.key === c.key ? (
                        <Editor
                          column={c}
                          value={r.values[c.key]}
                          onCommit={(v) => save(r, c.key, v)}
                          onCancel={() => setEditing(null)}
                        />
                      ) : c.type === "checkbox" ? (
                        <label className="flex h-10 items-center px-2">
                          <input
                            type="checkbox"
                            checked={Boolean(r.values[c.key])}
                            onChange={(e) => save(r, c.key, e.target.checked)}
                            className="h-4 w-4 rounded border-input accent-primary"
                            aria-label={`${c.label} for ${String(r.values[columns[0].key] ?? "row")}`}
                          />
                        </label>
                      ) : (
                        <div className="flex h-full min-h-10 items-center">
                          <button
                            onClick={() =>
                              !isLocked(c) &&
                              setEditing({ id: r.id, key: c.key })
                            }
                            className={cn(
                              "flex min-h-10 min-w-0 flex-1 items-center px-2 py-1.5 text-left",
                              !isLocked(c) ? "cursor-text" : "cursor-default",
                              c.primary && "font-medium",
                            )}
                            aria-label={
                              isLocked(c) ? undefined : `Edit ${c.label}`
                            }
                            disabled={isLocked(c)}
                          >
                            {display(c, r.values[c.key])}
                          </button>
                          {c.primary && r.href && (
                            <Link
                              href={r.href}
                              className="mr-1 flex h-6 shrink-0 items-center gap-0.5 rounded border bg-card px-1.5 text-xs text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                            >
                              Open <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="w-10 p-0 text-right">
                    <button
                      onClick={() => remove(r)}
                      onBlur={() =>
                        setConfirmDelete((d) => (d === r.id ? null : d))
                      }
                      className={cn(
                        "mr-1 inline-flex h-7 items-center justify-center rounded-md px-1.5 text-xs focus-visible:opacity-100",
                        confirmDelete === r.id
                          ? "bg-destructive text-destructive-foreground"
                          : "text-muted-foreground opacity-0 hover:bg-accent hover:text-destructive group-hover:opacity-100",
                      )}
                      aria-label={
                        confirmDelete === r.id
                          ? "Click again to delete permanently"
                          : "Delete row"
                      }
                    >
                      {confirmDelete === r.id ? (
                        "Delete?"
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
        {visible.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? `Nothing here yet.` : `No rows match.`}
          </p>
        )}
        {resource === "skills" ? (
          <NewSkillRow onCreated={(row) => setRows((rs) => [...rs, row])} />
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {visible.length} of {rows.length}. Click a cell to edit; Enter saves,
        Esc cancels.
      </p>
    </div>
  );
}

function optionLabel(col: Column, value: string) {
  return (
    col.options?.find((o) => o.value === value)?.label ??
    (value === "true" ? "Yes" : value === "false" ? "No" : value)
  );
}

function ChipSelect({
  icon,
  label,
  active,
  value,
  onChange,
  options,
  clearLabel,
}: {
  icon?: React.ReactNode;
  label: string;
  active: boolean;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  clearLabel: string;
}) {
  return (
    <label
      className={cn(
        "relative flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs",
        active
          ? "bg-primary-soft"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {icon}
      <span className="max-w-[16rem] truncate">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={label}
      >
        <option value="">{clearLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Editor({
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

function NewSkillRow({ onCreated }: { onCreated: (r: Row) => void }) {
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const add = () => {
    if (!name.trim()) return;
    start(async () => {
      const res = await createSkillAction(name);
      if (!res.ok) return void toast.error(res.error);
      const { id, ...values } = res.data;
      onCreated({ id, updatedAt: null, values });
      setName("");
    });
  };
  return (
    <label className="flex h-10 items-center gap-2 border-b px-2 text-sm text-muted-foreground focus-within:text-foreground">
      <Plus className="h-4 w-4 shrink-0" aria-hidden />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        placeholder={pending ? "Adding" : "New skill, then Enter"}
        disabled={pending}
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        aria-label="New skill name"
      />
    </label>
  );
}
