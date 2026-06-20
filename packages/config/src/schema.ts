import { z } from "zod";

/**
 * Centralized site configuration schema.
 * Source of truth for all site-level settings (profile, landing copy, blog,
 * social links, SEO, etc.). Consumed by every app via `getSettings()`.
 */
export const SettingsSchema = z.object({
  // ── Profile ────────────────────────────────────────────────────────────
  name: z.string().default("Eggi Satria"),
  jobTitle: z.string().default("Full Stack Developer"),
  email: z.string().email().default("eggisatria2310@gmail.com"),
  bio: z
    .string()
    .default(
      "Full Stack Developer passionate about building exceptional digital experiences.",
    ),
  avatar: z.string().default(""),
  location: z.string().default("Indonesia"),
  phone: z.string().default(""),

  // ── Landing Page ───────────────────────────────────────────────────────
  heroTitle: z.string().default("Hi, I'm Eggi"),
  heroSubtitle: z.string().default("Full Stack Developer"),
  heroDescription: z
    .string()
    .default(
      "I build things for the web. Specializing in creating exceptional digital experiences that are fast, accessible, and beautiful.",
    ),
  aboutTitle: z.string().default("About Me"),
  aboutDescription: z
    .string()
    .default(
      "A passionate developer with experience in building modern web applications.",
    ),
  resumeUrl: z.string().default(""),
  resumeFileName: z.string().default(""),

  // ── Blog ───────────────────────────────────────────────────────────────
  blogTitle: z.string().default("Blog"),
  blogDescription: z
    .string()
    .default("Thoughts on software development, design, and technology."),
  postsPerPage: z.number().int().min(1).max(50).default(10),
  showReadingTime: z.boolean().default(true),
  showViewCount: z.boolean().default(true),

  // ── Social Links ───────────────────────────────────────────────────────
  twitter: z.string().default("egistr"),
  github: z.string().default("EgiStr"),
  linkedin: z.string().default("eggisatria"),
  instagram: z.string().default("_egistr"),
  youtube: z.string().default(""),

  // ── SEO & Meta ─────────────────────────────────────────────────────────
  siteTitle: z.string().default("Eggi Satria | Full Stack Developer"),
  siteDescription: z
    .string()
    .default(
      "Full Stack Developer specializing in building exceptional digital experiences.",
    ),
  siteKeywords: z
    .string()
    .default("developer, full stack, react, nextjs, typescript"),
  ogImage: z.string().default(""),
  googleAnalyticsId: z.string().default(""),
});

export type Settings = z.infer<typeof SettingsSchema>;
export type SettingsKey = keyof Settings;
