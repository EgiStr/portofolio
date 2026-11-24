import { GoogleGenerativeAI } from "@google/generative-ai";
import { factGuard, stripDashes } from "@ecosystem/cv-core";

const apiKey = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const RULES = `Rules you must follow:
- Use only facts present in SOURCE. Never add a number, percentage, date, tool, employer, client, award or outcome that SOURCE does not state. If a stronger claim would need a fact that is missing, write the plain version and list the missing fact under GAPS.
- Start with a past-tense action verb (present tense only for a current role). No "I", "we", "my".
- No dashes as punctuation, no emoji, no buzzwords (leverage, spearhead, synergy, cutting-edge, robust, seamless, passionate).
- Name the thing built and who it was for, then the result, in plain English a recruiter and an ATS can both read.`;

export const POLISH_PROMPT = `You edit CV bullets for an early-career AI engineer.
${RULES}
- Rewrite only the text under SOURCE. CONTEXT is background you may draw facts from; never rewrite or return it.
- Give one or two alternative versions of that single bullet, each under 35 words.
Return exactly this format and nothing else:
BULLETS:
- <alternative>
GAPS:
- <a fact the writer could add to make this stronger, or "none">`;

const TAILOR_PROMPT = `You tailor one CV text to a job description.
${RULES}
- Keep the form and length of the text under SOURCE: a summary stays 2 to 4 sentences and under 90 words. MORE SOURCE is the rest of the CV, for facts only; do not copy its bullets in.
- Reuse the job description's own words for skills the SOURCE already shows. Never claim a skill only the job description mentions; list it under GAPS instead.
Return exactly this format and nothing else:
TEXT:
<the rewritten text>
GAPS:
- <job requirement SOURCE does not support, or "none">`;

export interface AiSuggestion {
  /** Accepted lines, after the fact check and dash cleanup. */
  lines: string[];
  /** Lines the fact check refused, with the unsupported tokens. */
  rejected: { text: string; unknown: string[] }[];
  gaps: string[];
}

function section(raw: string, name: string, next: string | null): string {
  const start = raw.indexOf(`${name}:`);
  if (start < 0) return "";
  const from = start + name.length + 1;
  const end = next ? raw.indexOf(`${next}:`, from) : -1;
  return raw.slice(from, end < 0 ? undefined : end).trim();
}

// Stop at an echoed input label: models sometimes repeat SOURCE after the answer.
const listItems = (block: string) =>
  block
    .split(
      /\n(?:SOURCE|CONTEXT|MORE SOURCE|TARGET JOB|JOB DESCRIPTION)\b[^\n]*:/,
    )[0]
    .split("\n")
    .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
    .filter((l) => l && l.toLowerCase() !== "none");

function check(
  lines: string[],
  sources: string[],
): Pick<AiSuggestion, "lines" | "rejected"> {
  const out: Pick<AiSuggestion, "lines" | "rejected"> = {
    lines: [],
    rejected: [],
  };
  for (const raw of lines) {
    const text = stripDashes(raw);
    const g = factGuard(text, sources);
    if (g.ok) out.lines.push(text);
    else out.rejected.push({ text, unknown: g.unknown });
  }
  return out;
}

async function generate(prompt: string, input: string): Promise<string> {
  if (!gemini) throw new Error("GEMINI_API_KEY is not configured");
  const model = gemini.getGenerativeModel({
    model: MODEL,
    generationConfig: { temperature: 0.3 },
  });
  const result = await model.generateContent([prompt, input]);
  return result.response.text();
}

/**
 * Rewrite bullets. `facts` are extra source passages (website records, brain
 * notes) the model may draw on; anything outside text + facts is rejected.
 */
export async function polishBullets(
  text: string,
  facts: string[] = [],
  jobDescription?: string,
): Promise<AiSuggestion> {
  const input = [
    `SOURCE:\n${text}`,
    facts.length
      ? `CONTEXT (other lines of this CV entry and notes the writer confirmed):\n${facts.join("\n---\n")}`
      : "",
    jobDescription
      ? `TARGET JOB (for emphasis only, not a source of facts):\n${jobDescription.slice(0, 6000)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const raw = await generate(POLISH_PROMPT, input);
  const bullets = listItems(section(raw, "BULLETS", "GAPS"));
  return {
    ...check(bullets, [text, ...facts]),
    gaps: listItems(section(raw, "GAPS", null)),
  };
}

export async function tailorText(
  text: string,
  jobDescription: string,
  facts: string[] = [],
): Promise<AiSuggestion> {
  const input = [
    `SOURCE:\n${text}`,
    facts.length ? `MORE SOURCE:\n${facts.join("\n---\n")}` : "",
    `JOB DESCRIPTION:\n${jobDescription.slice(0, 8000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const raw = await generate(TAILOR_PROMPT, input);
  const rewritten = section(raw, "TEXT", "GAPS");
  // The job description is not a fact source: words taken only from it are refused.
  return {
    ...check(rewritten ? [rewritten] : [], [text, ...facts]),
    gaps: listItems(section(raw, "GAPS", null)),
  };
}

/** Kept for the old Resume page: returns accepted bullets, or the original text. */
export async function polishContent(text: string): Promise<string[]> {
  try {
    const r = await polishBullets(text);
    return r.lines.length ? r.lines : [text];
  } catch (error) {
    console.error("Error polishing content:", error);
    return [text];
  }
}
