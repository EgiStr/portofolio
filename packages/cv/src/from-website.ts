import type { Entry, Bullet } from "./schema";
import { formatMonth, formatRange, splitBullets } from "./text";

/**
 * Turn website rows (the same Supabase tables the landing page reads) into CV
 * entries. Pure functions on plain objects, so they work with Prisma rows and
 * with JSON from an API alike.
 */

export interface ExperienceRow {
  id: string;
  company: string;
  position: string;
  description?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  current?: boolean;
  location?: string | null;
}

export interface ProjectRow {
  id: string;
  title: string;
  description: string;
  liveUrl?: string | null;
  githubUrl?: string | null;
  techStack?: { name: string }[];
}

export interface CertificationRow {
  id: string;
  name: string;
  organization: string;
  issueDate: Date | string;
}

export interface SkillRow {
  name: string;
  category: string;
}

export function experienceEntry(r: ExperienceRow): Entry {
  return {
    id: `exp-${r.id}`,
    title: r.position,
    meta: [
      r.company,
      r.location,
      formatRange(r.startDate, r.endDate, r.current),
    ]
      .filter(Boolean)
      .join(" | "),
    bullets: splitBullets(r.description).map((text) => ({ text })),
    source: { table: "experience", id: r.id },
  };
}

export function projectEntry(r: ProjectRow): Entry {
  const stack = r.techStack?.map((t) => t.name).join(", ");
  return {
    id: `proj-${r.id}`,
    title: r.title,
    meta: stack || undefined,
    bullets: splitBullets(r.description).map((text) => ({ text })),
    source: { table: "project", id: r.id },
  };
}

export function certificationItem(r: CertificationRow): Bullet {
  return { text: `${r.name} (${r.organization}, ${formatMonth(r.issueDate)})` };
}

const CATEGORY_LABEL: Record<string, string> = {
  LANGUAGE: "Languages:",
  FRAMEWORK: "Frameworks:",
  DATABASE: "Databases:",
  DEVOPS: "DevOps:",
  TOOL: "Tools:",
  OTHER: "Other:",
};

/** One line per category. Proficiency levels are dropped: ATS parsers cannot read bars. */
export function skillItems(rows: SkillRow[]): Bullet[] {
  const groups = new Map<string, string[]>();
  for (const r of rows)
    groups.set(r.category, [...(groups.get(r.category) ?? []), r.name]);
  return [...groups.entries()].map(([cat, names]) => ({
    lead: CATEGORY_LABEL[cat] ?? `${cat}:`,
    text: `${names.join(", ")}.`,
  }));
}
