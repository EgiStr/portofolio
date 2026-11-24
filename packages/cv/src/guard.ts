/**
 * Checks AI output against its sources before it reaches the CV. A rewrite may
 * reorder and tighten words, but every number and every capitalised name in
 * the output must already appear in the source text the model was given.
 */

const DASHES = /\s*[‒–—―]\s*|\s+-{1,2}\s+/g;

/** Replace dash punctuation with a comma, which reads the same in a bullet. */
export function stripDashes(s: string): string {
  return s
    .replace(DASHES, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Words that start sentences or are routinely capitalised without being facts.
const COMMON = new Set(
  "a an the and or of to in on for with by from as at into via across using used built led designed developed analysed analyzed tested created proposed prepared presented automated deployed agreed replaced assisted reduced improved implemented delivered wrote ran made set defined trained evaluated managed maintained migrated integrated added i we our my this that these those it ai ml api ui ux qa".split(
    " ",
  ),
);

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}%.+#]/gu, "");

export interface GuardResult {
  ok: boolean;
  /** Numbers or names in the output that no source contains. */
  unknown: string[];
}

export function factGuard(output: string, sources: string[]): GuardResult {
  const haystack = sources.join("\n").toLowerCase();
  const numbersInSource = new Set(
    (haystack.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", ".")),
  );
  const unknown = new Set<string>();

  for (const n of output.match(/\d+(?:[.,]\d+)?/g) ?? []) {
    if (!numbersInSource.has(n.replace(",", "."))) unknown.add(n);
  }

  // Capitalised tokens and acronyms (Kubernetes, AWS, LangChain) must be in a source.
  // The first word of a sentence is capitalised by grammar, not because it is a name;
  // acronyms and mixed case (AWS, LangChain) are still checked there.
  const words = [...output.matchAll(/\b[\p{Lu}][\p{L}\p{N}+#.]*\b/gu)]
    .filter(
      (m) =>
        !/(^|[.!?:;]\s+)$/.test(output.slice(0, m.index)) ||
        /[\p{Lu}\d]/u.test(m[0].slice(1)),
    )
    .map((m) => m[0]);
  for (const w of words) {
    const key = norm(w).replace(/\.$/, "");
    if (!key || COMMON.has(key)) continue;
    if (!haystack.includes(key)) unknown.add(w);
  }
  return { ok: unknown.size === 0, unknown: [...unknown] };
}
