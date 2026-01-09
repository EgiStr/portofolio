"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  User,
  Briefcase,
  Code,
  Scroll,
  Award,
  Key,
} from "lucide-react";
import { Button } from "@ecosystem/ui";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { name: "Blog Posts", href: "/dashboard/posts", icon: FileText },
  { name: "Experience", href: "/dashboard/experiences", icon: Briefcase },
  { name: "Skills", href: "/dashboard/skills", icon: Code },
  { name: "Certifications", href: "/dashboard/certifications", icon: Award },
  { name: "Resume", href: "/dashboard/resume", icon: Scroll },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="Eggi Satria Logo" className="h-8 w-auto" />
          <span className="text-foreground font-medium">Manager</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {session?.user?.name || "Admin"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
