import type { CvContent, Entry } from "./schema";
import { visibleSections } from "./schema";

/** Strip list markers that the website stores in Experience.description ("• ", "- ", "* "). */
export function cleanBullet(line: string): string {
  return line.replace(/^\s*[•\-*]\s+/, "").trim();
}

/** Split a stored description into bullet texts. */
export function splitBullets(description: string | null | undefined): string[] {
  return (description ?? "").split(/\r?\n/).map(cleanBullet).filter(Boolean);
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "Sep 2026" in UTC, so the server and the browser print the same month. */
export function formatMonth(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatRange(
  start: Date | string,
  end?: Date | string | null,
  current?: boolean,
): string {
  return `${formatMonth(start)} - ${current || !end ? "Present" : formatMonth(end)}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 60);
}

export function entryText(e: Entry): string {
  return [
    e.title,
    e.meta,
    ...e.bullets.map((b) => (b.lead ? `${b.lead} ${b.text}` : b.text)),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Reading-order plain text of the visible CV, as an ATS parser would extract it. */
export function plainText(content: CvContent): string {
  const h = content.header;
  const out: string[] = [h.name];
  if (h.headline) out.push(h.headline);
  out.push([h.location, h.phone, h.email].filter(Boolean).join(" | "));
  if (h.links.length) out.push(h.links.map((l) => l.label).join(" | "));
  for (const s of visibleSections(content)) {
    out.push(s.title.toUpperCase());
    if (s.type === "paragraph" && s.text) out.push(s.text);
    for (const e of s.entries ?? []) out.push(entryText(e));
    for (const b of s.items ?? [])
      out.push(b.lead ? `${b.lead} ${b.text}` : b.text);
  }
  return out.join("\n");
}
