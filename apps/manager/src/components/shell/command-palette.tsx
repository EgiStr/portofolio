"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CornerDownLeft,
  Moon,
  Plus,
  Search,
  Sun,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@ecosystem/ui";
import { NAV_ITEMS } from "./nav";
import { useTheme } from "./theme";
import { searchRecords, type SearchHit } from "@/actions/search";

type Entry = {
  id: string;
  group: string;
  label: string;
  hint?: string | null;
  icon?: LucideIcon;
  run: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [pending, start] = useTransition();
  const list = useRef<HTMLDivElement>(null);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const fixed: Entry[] = useMemo(
    () => [
      ...NAV_ITEMS.map((i) => ({
        id: `nav:${i.href}`,
        group: "Go to",
        label: i.name,
        icon: i.icon,
        run: () => go(i.href),
      })),
      ...NAV_ITEMS.filter((i) => i.newHref).map((i) => ({
        id: `new:${i.href}`,
        group: "Create",
        label: i.newLabel!,
        icon: Plus,
        run: () => go(i.newHref!),
      })),
      {
        id: "new:app",
        group: "Create",
        label: "New job application",
        icon: Plus,
        run: () => go("/dashboard/applications?new=1"),
      },
      {
        id: "theme:light",
        group: "Theme",
        label: "Light theme",
        icon: Sun,
        run: () => (setTheme("light"), onOpenChange(false)),
      },
      {
        id: "theme:dark",
        group: "Theme",
        label: "Dark theme",
        icon: Moon,
        run: () => (setTheme("dark"), onOpenChange(false)),
      },
      {
        id: "theme:system",
        group: "Theme",
        label: "Match system theme",
        icon: Monitor,
        run: () => (setTheme("system"), onOpenChange(false)),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Records come from the server; debounce so typing stays smooth.
  useEffect(() => {
    if (q.trim().length < 2) return setHits([]);
    const t = setTimeout(
      () => start(async () => setHits(await searchRecords(q))),
      180,
    );
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) {
      setQ("");
      setHits([]);
    }
  }, [open]);

  const entries = useMemo(() => {
    const term = q.trim().toLowerCase();
    const shown = term
      ? fixed.filter((e) => e.label.toLowerCase().includes(term))
      : fixed.filter((e) => e.group !== "Theme");
    const records: Entry[] = hits.map((h) => ({
      id: `rec:${h.href}`,
      group: h.kind,
      label: h.title,
      hint: h.hint,
      run: () => go(h.href),
    }));
    return [...records, ...shown];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, hits, fixed]);

  useEffect(() => setActive(0), [q, hits]);
  useEffect(() => {
    list.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, entries.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      entries[active]?.run();
    }
  };

  let lastGroup = "";
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/20" />
        <Dialog.Content
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-32px)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl"
          onKeyDown={onKey}
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <div className="flex items-center gap-2 border-b px-3">
            <Search
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search pages, posts, projects, applications"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Search"
              role="combobox"
              aria-expanded
              aria-controls="palette-list"
              aria-activedescendant={
                entries[active] ? `palette-${active}` : undefined
              }
            />
            {pending && (
              <span className="text-xs text-muted-foreground">Searching</span>
            )}
          </div>
          <div
            ref={list}
            id="palette-list"
            role="listbox"
            className="max-h-[min(60vh,420px)] overflow-y-auto p-1.5"
          >
            {entries.length === 0 && !pending && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nothing matches “{q}”.
              </p>
            )}
            {entries.map((e, i) => {
              const header =
                e.group !== lastGroup ? (lastGroup = e.group) : null;
              const Icon = e.icon;
              return (
                <div key={e.id}>
                  {header && (
                    <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      {header}
                    </p>
                  )}
                  <button
                    id={`palette-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={e.run}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm",
                      i === active && "bg-accent",
                    )}
                  >
                    {Icon ? (
                      <Icon
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    ) : (
                      <span className="w-4" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{e.label}</span>
                    {e.hint && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {e.hint}
                      </span>
                    )}
                    {i === active && (
                      <CornerDownLeft
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 border-t px-3 py-2 font-mono text-[11px] text-muted-foreground">
            <span>↑↓ move</span>
            <span>Enter open</span>
            <span>Esc close</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
