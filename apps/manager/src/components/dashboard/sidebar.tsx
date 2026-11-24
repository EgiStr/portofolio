"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronsLeft, LogOut, Monitor, Moon, Search, Sun } from "lucide-react";
import { cn } from "@ecosystem/ui";
import { NAV, navFor } from "@/components/shell/nav";
import { useTheme, type ThemeChoice } from "@/components/shell/theme";

interface SidebarProps {
  /** Mobile drawer state. */
  isOpen?: boolean;
  onClose?: () => void;
  /** Desktop: hide the sidebar completely (Ctrl+\). */
  collapsed?: boolean;
  onCollapse?: () => void;
  onSearch?: () => void;
}

const THEMES: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function Sidebar({
  isOpen = false,
  onClose,
  collapsed = false,
  onCollapse,
  onSearch,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { choice, setTheme } = useTheme();
  const current = navFor(pathname)?.href;
  const name = session?.user?.name || "Admin";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-50 flex w-[248px] flex-col border-r bg-sidebar transition-transform duration-150",
          isOpen ? "translate-x-0" : "-translate-x-full",
          !collapsed && "lg:translate-x-0",
        )}
        aria-label="Sidebar"
      >
        <div className="group flex h-12 items-center gap-2 px-3">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent"
          >
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-[11px] font-semibold text-primary-foreground"
              aria-hidden
            >
              {name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-sm font-medium">
              {name}&rsquo;s manager
            </span>
          </Link>
          <button
            onClick={() => (isOpen ? onClose?.() : onCollapse?.())}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground lg:opacity-0 lg:focus-visible:opacity-100 lg:group-hover:opacity-100"
            aria-label="Hide sidebar"
            title="Hide sidebar (Ctrl+\)"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            onClick={() => {
              onClose?.();
              onSearch?.();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Search className="h-4 w-4" strokeWidth={1.75} />
            <span className="flex-1 text-left">Search</span>
            <kbd className="font-mono text-[11px]">Ctrl K</kbd>
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                {g.group}
              </p>
              <ul className="space-y-px">
                {g.items.map((item) => {
                  const active = item.href === current;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-[32px] items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
                          active
                            ? "bg-primary-soft font-medium text-foreground"
                            : "text-foreground/80 hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                          strokeWidth={1.75}
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t p-3">
          <div
            role="radiogroup"
            aria-label="Theme"
            className="grid grid-cols-3 gap-1 rounded-md bg-accent p-0.5"
          >
            {THEMES.map((t) => (
              <button
                key={t.value}
                role="radio"
                aria-checked={choice === t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded px-1 py-1 text-xs",
                  choice === t.value
                    ? "bg-card font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <t.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-1">
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {session?.user?.email}
            </p>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
