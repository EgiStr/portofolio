import type { Settings } from "./schema";

/**
 * Default values applied when the SiteConfig table is empty
 * (first deploy, fresh DB, or read failure).
 *
 * Keep in sync with `SettingsSchema` defaults; this object is the seed
 * used by `prisma/seed.ts` and the runtime fallback.
 */
export const defaultSettings: Settings = {
  name: "Eggi Satria",
  jobTitle: "Full Stack Developer",
  email: "eggisatria2310@gmail.com",
  bio: "Full Stack Developer passionate about building exceptional digital experiences.",
  avatar: "",
  location: "Indonesia",
  phone: "",

  heroTitle: "Hi, I'm Eggi",
  heroSubtitle: "Full Stack Developer",
  heroDescription:
    "I build things for the web. Specializing in creating exceptional digital experiences that are fast, accessible, and beautiful.",
  aboutTitle: "About Me",
  aboutDescription:
    "A passionate developer with experience in building modern web applications.",
  resumeUrl: "",
  resumeFileName: "",

  blogTitle: "Blog",
  blogDescription: "Thoughts on software development, design, and technology.",
  postsPerPage: 10,
  showReadingTime: true,
  showViewCount: true,

  twitter: "egistr",
  github: "EgiStr",
  linkedin: "eggisatria",
  instagram: "_egistr",
  youtube: "",

  siteTitle: "Eggi Satria | Full Stack Developer",
  siteDescription:
    "Full Stack Developer specializing in building exceptional digital experiences.",
  siteKeywords: "developer, full stack, react, nextjs, typescript",
  ogImage: "",
  googleAnalyticsId: "",
};
