import {
  Award,
  BarChart3,
  Briefcase,
  Code,
  FileText,
  FolderLock,
  FolderKanban,
  Home,
  Inbox,
  KanbanSquare,
  Key,
  Mail,
  Scroll,
  Settings,
  UserSquare,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  newHref?: string;
  newLabel?: string;
};

export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Workspace",
    items: [
      { name: "Home", href: "/dashboard", icon: Home },
      {
        name: "Posts",
        href: "/dashboard/posts",
        icon: FileText,
        newHref: "/dashboard/posts/new",
        newLabel: "New post",
      },
      {
        name: "Projects",
        href: "/dashboard/projects",
        icon: FolderKanban,
        newHref: "/dashboard/projects/new",
        newLabel: "New project",
      },
      {
        name: "Experience",
        href: "/dashboard/experiences",
        icon: Briefcase,
        newHref: "/dashboard/experiences/new",
        newLabel: "New role",
      },
      {
        name: "Skills",
        href: "/dashboard/skills",
        icon: Code,
        newHref: "/dashboard/skills/new",
        newLabel: "New skill",
      },
      {
        name: "Certifications",
        href: "/dashboard/certifications",
        icon: Award,
        newHref: "/dashboard/certifications/new",
        newLabel: "New certification",
      },
    ],
  },
  {
    group: "Career",
    items: [
      { name: "CV Studio", href: "/dashboard/cv", icon: Scroll },
      {
        name: "Job Tracker",
        href: "/dashboard/applications",
        icon: KanbanSquare,
      },
      { name: "Documents", href: "/dashboard/documents", icon: FolderLock },
      { name: "Resume", href: "/dashboard/resume", icon: UserSquare },
    ],
  },
  {
    group: "Audience",
    items: [
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { name: "Newsletter", href: "/dashboard/newsletter", icon: Mail },
      { name: "Contact", href: "/dashboard/contact", icon: Inbox },
    ],
  },
  {
    group: "System",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
      { name: "API keys", href: "/dashboard/api-keys", icon: Key },
    ],
  },
];

export const NAV_ITEMS = NAV.flatMap((g) => g.items);

/** The nav item a path belongs to: the longest href that prefixes it. */
export function navFor(pathname: string) {
  return NAV_ITEMS.filter(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

/** Breadcrumbs for a dashboard path, e.g. Posts / Edit. */
export function crumbs(pathname: string): { label: string; href?: string }[] {
  const item = navFor(pathname);
  if (!item || item.href === "/dashboard") return [{ label: "Home" }];
  const rest = pathname.slice(item.href.length).split("/").filter(Boolean);
  const out: { label: string; href?: string }[] = [
    { label: item.name, href: rest.length ? item.href : undefined },
  ];
  const last = rest[rest.length - 1];
  if (last === "new") out.push({ label: item.newLabel ?? "New" });
  else if (last === "edit") out.push({ label: "Edit" });
  else if (rest.length) out.push({ label: "Detail" });
  return out;
}
