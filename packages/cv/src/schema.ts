import { z } from "zod";

/**
 * Shape of a CV document stored in `cv_versions.content` / `cv_versions.style`.
 * One column layout on purpose: ATS parsers read a single column, standard
 * section titles and plain text dates most reliably.
 */

export const BulletSchema = z.object({
  /** Optional bold lead, e.g. "AI & ML:" in the skills list. */
  lead: z.string().max(80).optional(),
  text: z.string().max(600),
});

export const SourceSchema = z.object({
  table: z.enum(["experience", "project", "certification", "skill", "brain"]),
  /** Row id, or the brain note path when table is "brain". */
  id: z.string(),
});

export const EntrySchema = z.object({
  id: z.string(),
  /** Bold first line: role or project name. */
  title: z.string().max(200),
  /** Italic second line: organisation | place | dates. */
  meta: z.string().max(300).optional(),
  bullets: z.array(BulletSchema).max(12).default([]),
  hidden: z.boolean().optional(),
  source: SourceSchema.optional(),
});

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string().max(80),
  type: z.enum(["paragraph", "entries", "list"]),
  text: z.string().max(1500).optional(),
  entries: z.array(EntrySchema).max(30).optional(),
  items: z.array(BulletSchema).max(30).optional(),
  hidden: z.boolean().optional(),
});

export const LinkSchema = z.object({
  label: z.string().max(80),
  url: z.string().url(),
});

export const HeaderSchema = z.object({
  name: z.string().min(1).max(100),
  headline: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional(),
  links: z.array(LinkSchema).max(6).default([]),
});

export const CvContentSchema = z.object({
  header: HeaderSchema,
  sections: z.array(SectionSchema).max(15),
});

export const CvStyleSchema = z.object({
  font: z.enum(["Helvetica", "Times-Roman"]).default("Helvetica"),
  fontSize: z.number().min(9).max(12).default(10),
  lineHeight: z.number().min(1).max(1.5).default(1.2),
  /** Page margin in points (72pt = 1 inch). */
  margin: z.number().min(24).max(72).default(40),
  /** The phone number is printed in the PDF; the public web page hides it unless this is true. */
  showPhoneOnWeb: z.boolean().default(false),
});

export type Bullet = z.infer<typeof BulletSchema>;
export type Entry = z.infer<typeof EntrySchema>;
export type Section = z.infer<typeof SectionSchema>;
export type CvHeader = z.infer<typeof HeaderSchema>;
export type CvContent = z.infer<typeof CvContentSchema>;
export type CvStyle = z.infer<typeof CvStyleSchema>;

export const defaultStyle: CvStyle = CvStyleSchema.parse({});

/** Parse a stored style, falling back to defaults for missing or invalid fields. */
export function parseStyle(raw: unknown): CvStyle {
  const r = CvStyleSchema.safeParse(raw ?? {});
  return r.success ? r.data : defaultStyle;
}

/** Sections and entries the reader should see (hidden ones are kept for later tailoring). */
export function visibleSections(content: CvContent): Section[] {
  return content.sections
    .filter((s) => !s.hidden)
    .map((s) => ({ ...s, entries: s.entries?.filter((e) => !e.hidden) }));
}
