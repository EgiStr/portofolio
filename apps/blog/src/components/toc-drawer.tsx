"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { List } from "lucide-react";
import { useTocHeadings } from "./table-of-contents";

/**
 * Below-lg reachable TOC (S3/S4/S6): floating "On this page" trigger
 * (lg:hidden, zero reserved gutter when closed) opening a right slide-over
 * reusing the shared heading-collection hook — no second parser (A3).
 * Renders nothing when headings < 3 (same rule as the desktop rail).
 */
export function TocDrawer() {
  const headings = useTocHeadings();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(false);

  const close = useCallback(() => setOpen(false), []);

  // Esc dismiss while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Body scroll lock while open, restored on close.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus management: move focus into the panel on open,
  // return focus to the trigger on close.
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      panelRef.current?.focus();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  if (headings.length < 3) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="toc-drawer-panel"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-lg transition-colors hover:border-primary/40 hover:text-primary lg:hidden"
      >
        <List className="h-4 w-4" aria-hidden="true" />
        On this page
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            data-toc-drawer-backdrop="true"
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
          />
          <aside
            ref={panelRef}
            id="toc-drawer-panel"
            role="dialog"
            aria-label="Table of contents"
            tabIndex={-1}
            className="absolute right-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col overflow-y-auto border-l border-border bg-card p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                On this page
              </h4>
              <button
                type="button"
                autoFocus
                onClick={close}
                aria-label="Close table of contents"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-1 text-sm border-l border-border">
              {headings.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    onClick={close}
                    className="block border-l-2 -ml-px border-l-transparent py-1.5 pl-3 text-muted-foreground transition-colors hover:border-l-border hover:text-foreground"
                    style={{ paddingLeft: `${12 + (h.level - 2) * 12}px` }}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </>
  );
}
