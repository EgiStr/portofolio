"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronsRight, Menu, Search } from "lucide-react";
import { crumbs } from "./nav";

export function TopBar({
  collapsed,
  onExpand,
  onMenu,
  onSearch,
}: {
  collapsed: boolean;
  onExpand: () => void;
  onMenu: () => void;
  onSearch: () => void;
}) {
  const trail = crumbs(usePathname());
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-1 border-b bg-background/95 px-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 sm:px-4">
      <button
        onClick={onMenu}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      {collapsed && (
        <button
          onClick={onExpand}
          className="hidden h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground lg:flex"
          aria-label="Show sidebar"
          title="Show sidebar (Ctrl+\)"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      )}
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-0.5 text-sm">
          {trail.map((c, i) => (
            <li key={i} className="flex min-w-0 items-center gap-0.5">
              {i > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              )}
              {c.href ? (
                <Link
                  href={c.href}
                  className="truncate rounded px-1.5 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="truncate px-1.5 py-0.5" aria-current="page">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <button
        onClick={onSearch}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent lg:hidden"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>
    </header>
  );
}
