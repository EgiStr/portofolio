import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

type Node = {
  type: string;
  value?: string;
  children?: Node[];
  [key: string]: unknown;
};

// The blog renders with the same parser plugins, so two texts that parse to
// the same tree render the same post.
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

// Fields that change with formatting but not with what the reader sees.
// `spread` stays in: it decides tight or loose lists, which the blog renders.
const IGNORED = new Set(["position", "data"]);

function clean(node: Node): Node {
  const out: Node = { type: node.type };
  for (const [k, v] of Object.entries(node)) {
    if (k === "children" || IGNORED.has(k)) continue;
    out[k] = v;
  }
  if (node.children) {
    const kids: Node[] = [];
    for (const child of node.children.map(clean)) {
      const last = kids[kids.length - 1];
      if (child.type === "text" && last?.type === "text") {
        last.value = (last.value ?? "") + (child.value ?? "");
      } else kids.push(child);
    }
    out.children = kids;
  }
  if (out.type === "text" && typeof out.value === "string") {
    out.value = out.value.replace(/\s+/g, " ");
  }
  return out;
}

export function markdownTree(markdown: string): Node {
  return clean(parser.parse(markdown) as unknown as Node);
}

/**
 * Whether `output` renders the same post as `original`. Used to decide if the
 * block editor can open a post without changing it.
 */
export function sameDocument(original: string, output: string): boolean {
  return (
    JSON.stringify(markdownTree(original)) ===
    JSON.stringify(markdownTree(output))
  );
}

/** First differing node, for the note shown when a post opens in raw mode. */
export function firstDifference(original: string, output: string): string {
  const a = markdownTree(original).children ?? [];
  const b = markdownTree(output).children ?? [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
      return a[i]?.type ?? b[i]?.type ?? "unknown";
    }
  }
  return "none";
}
