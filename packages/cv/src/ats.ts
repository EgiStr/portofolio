import type { CvContent } from "./schema";
import { visibleSections } from "./schema";
import { plainText } from "./text";

/**
 * Deterministic ATS and writing check. No LLM: the same CV and job description
 * always give the same score, so a change in score means the CV changed.
 */

export type Severity = "error" | "warn" | "info";
export interface AtsIssue {
  rule: string;
  severity: Severity;
  message: string;
  /** Where it happened, e.g. "Work Experience > Intern, ...". */
  where?: string;
}
export interface KeywordReport {
  matched: string[];
  missing: string[];
  /** 0..1, share of job keywords found in the CV. */
  coverage: number;
}
export interface AtsReport {
  score: number;
  issues: AtsIssue[];
  keywords?: KeywordReport;
  stats: { words: number; bullets: number; sections: number };
}

const FIRST_PERSON = /\b(I|me|my|mine|we|our)\b/;
const WEAK_OPENERS =
  /^(responsible for|duties included|worked on|helped|assisted with|to |tasked with|in charge of)/i;
const DASH = /[–—]/;
const NON_TEXT = /[\u{1F300}-\u{1FAFF}☀-➿]/u;
const DATE_RANGE =
  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} - ((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}|Present)\b/;
const STANDARD_SECTIONS: [string, RegExp][] = [
  ["Experience", /experience|employment|work history/i],
  ["Education", /education/i],
  ["Skills", /skills/i],
];

// English and Indonesian words that carry no meaning for keyword matching.
const STOP = new Set(
  (
    "a an the and or of to in on for with at by from as is are be been being this that these those it its into over " +
    "you your we our they their will can may must should would could have has had do does not no yes all any each " +
    "other such more most than then also etc using use used able ability work working team strong good excellent " +
    "experience years year plus including include required requirements preferred qualification qualifications " +
    "responsibilities job role position candidate candidates who what which where when how about across within " +
    "need needs needed looking seeking build building develop developing help join company products product new " +
    "like well make ensure great want wants lead leading based knowledge understanding familiar familiarity " +
    "dan atau yang di ke dari untuk dengan pada dalam ini itu adalah sebagai akan dapat serta memiliki mampu " +
    "kami kamu anda para tahun pengalaman minimal kemampuan baik bisa juga tim kerja bidang terkait"
  ).split(/\s+/),
);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./ ]+/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[./]+|[./]+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t) && !/^\d+$/.test(t));
}

/** Most frequent single terms and two-word phrases of the job description. */
export function jobKeywords(jd: string, limit = 25): string[] {
  const toks = tokens(jd);
  const counts = new Map<string, number>();
  toks.forEach((t, i) => {
    counts.set(t, (counts.get(t) ?? 0) + 1);
    const next = toks[i + 1];
    if (next) {
      const bi = `${t} ${next}`;
      // Two-word phrases count only if they repeat, so random neighbours are ignored.
      counts.set(bi, (counts.get(bi) ?? 0) + 0.75);
    }
  });
  return [...counts.entries()]
    .filter(([k, v]) => (k.includes(" ") ? v >= 1.5 : true))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([k]) => k);
}

export function keywordReport(content: CvContent, jd: string): KeywordReport {
  const cv = ` ${tokens(plainText(content)).join(" ")} `;
  const kws = jobKeywords(jd);
  const matched = kws.filter((k) => cv.includes(` ${k} `));
  const missing = kws.filter((k) => !matched.includes(k));
  return {
    matched,
    missing,
    coverage: kws.length ? matched.length / kws.length : 1,
  };
}

export function atsCheck(
  content: CvContent,
  jobDescription?: string | null,
): AtsReport {
  const issues: AtsIssue[] = [];
  const h = content.header;
  const sections = visibleSections(content);

  if (!h.email)
    issues.push({
      rule: "contact",
      severity: "error",
      message: "Add an email address.",
    });
  if (!h.phone)
    issues.push({
      rule: "contact",
      severity: "warn",
      message: "Add a phone number.",
    });
  if (!h.location)
    issues.push({
      rule: "contact",
      severity: "info",
      message: "Add a city so recruiters can filter by location.",
    });
  if (!h.links.some((l) => /linkedin\.com/i.test(l.url)))
    issues.push({
      rule: "contact",
      severity: "info",
      message: "Add a LinkedIn profile link.",
    });

  for (const [name, re] of STANDARD_SECTIONS) {
    if (!sections.some((s) => re.test(s.title)))
      issues.push({
        rule: "sections",
        severity: "warn",
        message: `No section titled like "${name}". ATS parsers look for standard titles.`,
      });
  }

  const summary = sections.find((s) => s.type === "paragraph");
  const summaryWords = summary?.text?.split(/\s+/).filter(Boolean).length ?? 0;
  if (!summary)
    issues.push({
      rule: "summary",
      severity: "info",
      message: "Add a short summary at the top.",
    });
  else if (summaryWords > 90)
    issues.push({
      rule: "summary",
      severity: "warn",
      message: `Summary has ${summaryWords} words. Aim for 40 to 80.`,
      where: summary.title,
    });

  let bullets = 0;
  for (const s of sections) {
    if (s.type === "paragraph" && s.text) {
      if (DASH.test(s.text))
        issues.push({
          rule: "style",
          severity: "info",
          message: "Long dash in text. Use a comma or a period.",
          where: s.title,
        });
    }
    for (const e of s.entries ?? []) {
      const where = `${s.title} > ${e.title}`;
      if (
        e.meta &&
        /experience|education|organi[sz]ation|project/i.test(s.title) &&
        !DATE_RANGE.test(e.meta) &&
        !/\b\d{4}\b/.test(e.meta)
      )
        issues.push({
          rule: "dates",
          severity: "warn",
          message:
            "No date found. Write dates as text, e.g. Sep 2026 - Present.",
          where,
        });
      if (/experience/i.test(s.title) && e.bullets.length === 0)
        issues.push({
          rule: "bullets",
          severity: "warn",
          message: "Role has no bullet points.",
          where,
        });
      for (const b of e.bullets) {
        bullets++;
        const words = b.text.split(/\s+/).filter(Boolean).length;
        if (FIRST_PERSON.test(b.text))
          issues.push({
            rule: "voice",
            severity: "warn",
            message: `First person in "${b.text.slice(0, 50)}...". Start with the verb.`,
            where,
          });
        if (WEAK_OPENERS.test(b.text))
          issues.push({
            rule: "verbs",
            severity: "warn",
            message: `Weak opener in "${b.text.slice(0, 50)}...". Start with an action verb.`,
            where,
          });
        if (words > 45)
          issues.push({
            rule: "length",
            severity: "info",
            message: `Bullet has ${words} words. Over 45 is hard to scan.`,
            where,
          });
        if (DASH.test(b.text))
          issues.push({
            rule: "style",
            severity: "info",
            message: "Long dash in a bullet. Use a comma or a period.",
            where,
          });
        if (NON_TEXT.test(b.text))
          issues.push({
            rule: "parse",
            severity: "warn",
            message: "Emoji or symbol in a bullet may not parse.",
            where,
          });
      }
    }
  }

  const text = plainText(content);
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words > 1100)
    issues.push({
      rule: "length",
      severity: "warn",
      message: `About ${words} words. Two pages hold roughly 900 to 1000.`,
    });

  const keywords = jobDescription?.trim()
    ? keywordReport(content, jobDescription)
    : undefined;

  const penalty = issues.reduce(
    (p, i) => p + (i.severity === "error" ? 15 : i.severity === "warn" ? 5 : 1),
    0,
  );
  const structure = Math.max(0, 100 - penalty);
  const score = keywords
    ? Math.round(structure * 0.6 + keywords.coverage * 100 * 0.4)
    : structure;

  return {
    score,
    issues,
    keywords,
    stats: { words, bullets, sections: sections.length },
  };
}
