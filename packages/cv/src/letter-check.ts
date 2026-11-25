import { letterText, type LetterContent } from "./letter";

export interface LetterIssue {
  level: "error" | "warn";
  message: string;
}

export interface LetterReport {
  /** True when nothing blocks sending the letter. */
  ok: boolean;
  words: number;
  issues: LetterIssue[];
}

const DASH = /[‒–—―]|\s-{1,2}\s/;
const PLACEHOLDER = /\[[^\]]*\]|\bTODO\b|\bTBD\b|lorem ipsum/i;
const GENERIC_SALUTATION = /^dear\s+(sir|madam|sir\/madam|sirs)/i;

/**
 * Deterministic checks a recruiter would notice: placeholders left in, dash
 * punctuation, a letter that never names the company, or one that is too
 * short or too long to read. Wording is not judged here.
 */
export function letterCheck(c: LetterContent): LetterReport {
  const issues: LetterIssue[] = [];
  const body = c.paragraphs.join("\n");
  const full = letterText(c);
  const words = body.split(/\s+/).filter(Boolean).length;

  if (c.paragraphs.some((p) => !p.trim()))
    issues.push({ level: "error", message: "A paragraph is empty." });
  if (PLACEHOLDER.test(full))
    issues.push({
      level: "error",
      message: "A placeholder is still in the text.",
    });
  if (DASH.test(full))
    issues.push({
      level: "warn",
      message: "Dash punctuation found. Use a comma or a full stop.",
    });
  if (!body.toLowerCase().includes(c.recipient.company.toLowerCase()))
    issues.push({
      level: "warn",
      message: `The body never names ${c.recipient.company}.`,
    });
  if (GENERIC_SALUTATION.test(c.salutation.trim()))
    issues.push({
      level: "warn",
      message: "Address the hiring team or a named person, not Sir or Madam.",
    });
  if (words < 120)
    issues.push({
      level: "warn",
      message: `Short: ${words} words in the body.`,
    });
  if (words > 400)
    issues.push({
      level: "warn",
      message: `Long: ${words} words in the body.`,
    });

  return {
    ok: !issues.some((i) => i.level === "error"),
    words,
    issues,
  };
}
