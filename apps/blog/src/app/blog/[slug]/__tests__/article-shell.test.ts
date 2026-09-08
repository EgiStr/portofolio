import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const BLOG_ROOT = process.cwd();
const LAYOUT_PATH = path.join(BLOG_ROOT, "src/app/layout.tsx");
const ARTICLE_PAGE_PATH = path.join(BLOG_ROOT, "src/app/blog/[slug]/page.tsx");
const TOC_PATH = path.join(BLOG_ROOT, "src/components/table-of-contents.tsx");
const GLOBALS_PATH = path.join(BLOG_ROOT, "src/app/globals.css");

function read(p: string): string {
  return fs.readFileSync(p, "utf8");
}

describe("article shell contract (S1/S2/S5/S7/S8/S9)", () => {
  it("S1: article renders a wide shell escaping max-w-2xl", () => {
    const page = read(ARTICLE_PAGE_PATH);
    // Wide article shell marker + token (max-w-6xl family) lives ONLY in article
    expect(page).toMatch(/data-article-shell/);
    expect(page).toMatch(/max-w-6xl/);
    // RootLayout must stay narrow-stable: no wide tokens at shell level (S7 leak guard)
    const layout = read(LAYOUT_PATH);
    expect(layout).toMatch(/max-w-2xl/);
    expect(layout).toMatch(/data-blog-shell="narrow"/);
    expect(layout).not.toMatch(/max-w-6xl/);
    expect(layout).not.toMatch(/max-w-5xl/);
    expect(layout).not.toMatch(/max-w-4xl/);
    expect(layout).not.toMatch(/data-blog-shell="wide"/);
    // Article-only wide breakout must be scoped in CSS (never a global wide shell)
    const css = fs.existsSync(GLOBALS_PATH) ? read(GLOBALS_PATH) : "";
    expect(css).toMatch(/data-article-shell/);
    expect(css).toMatch(/min\(72rem, 100vw - 2rem\)/);
  });

  it("S1: desktop rail is a grid sibling OUTSIDE the prose measure", () => {
    const page = read(ARTICLE_PAGE_PATH);
    // Grid with prose minmax + rail 220-280px range
    expect(page).toMatch(
      /lg:grid-cols-\[minmax\(0,42rem\)_(220px|240px|260px|280px)\]/,
    );
    // Prose container marker scoped separately from rail
    expect(page).toMatch(/data-prose-container/);
    expect(page).toMatch(/data-toc-rail/);
    // Aside must be a direct grid child gated to lg (hidden lg:block)
    expect(page).toMatch(/hidden lg:block/);
    // TOC aside must NOT be nested inside the prose container element:
    // prose container div closes before the aside opens.
    const proseIdx = page.indexOf("data-prose-container");
    const asideIdx = page.indexOf("data-toc-rail");
    expect(proseIdx).toBeGreaterThan(-1);
    expect(asideIdx).toBeGreaterThan(-1);
    const between = page.slice(proseIdx, asideIdx);
    expect(between).toMatch(/<\/div>/);
  });

  it("S2: prose column never exceeds max-w-2xl inside the wide shell", () => {
    const page = read(ARTICLE_PAGE_PATH);
    // Prose wrapper caps measure and allows shrink
    expect(page).toMatch(/max-w-2xl/);
    expect(page).toMatch(/min-w-0/);
  });

  it("S5: short-post fallback collapses the rail (no empty gutter)", () => {
    const page = read(ARTICLE_PAGE_PATH);
    const css = fs.existsSync(GLOBALS_PATH) ? read(GLOBALS_PATH) : "";
    const combined = `${page}\n${css}`;
    // Either conditional collapse in page or :has()-based CSS collapse for empty rail
    expect(combined).toMatch(
      /:has\(|:empty|headings\.length|isTocEligible|hasToc/,
    );
    // Drawer trigger must be suppressed for short posts (drawer returns null on <3)
    const toc = read(TOC_PATH);
    expect(toc).toMatch(/headings\.length < 3/);
  });

  it("S7: non-article pages keep the narrow centered shell", () => {
    const layout = read(LAYOUT_PATH);
    // Narrow measure preserved at shell level (header/footer inner + root narrow)
    expect(layout).toMatch(/max-w-2xl/);
    expect(layout).toMatch(/data-blog-shell="narrow"/);
    // Hard fail on any wide leak at shell level: home/about/list would inherit it
    expect(layout).not.toMatch(/max-w-6xl/);
    expect(layout).not.toMatch(/max-w-5xl/);
    expect(layout).not.toMatch(/max-w-4xl/);
    expect(layout).not.toMatch(/data-blog-shell="wide"/);
    // globals.css default-narrow guard: non-article main children capped at 42rem
    const css = fs.existsSync(GLOBALS_PATH) ? read(GLOBALS_PATH) : "";
    expect(css).toMatch(/data-blog-shell/);
    expect(css).toMatch(/max-width:\s*42rem/);
    // Wide breakout is article-scoped only (never matches non-article children)
    expect(css).toMatch(/data-article-shell/);
    // Home / list / about sources must NOT opt into the wide shell
    for (const rel of [
      "src/app/page.tsx",
      "src/app/blog/page.tsx",
      "src/app/about/page.tsx",
    ]) {
      const src = read(path.join(BLOG_ROOT, rel));
      expect(src).not.toMatch(/data-article-shell/);
      expect(src).not.toMatch(/max-w-6xl/);
      expect(src).not.toMatch(/data-toc-rail/);
      expect(src).not.toMatch(/TocDrawer/);
    }
  });

  it("S8: sticky rail + active-highlight observer preserved", () => {
    const toc = read(TOC_PATH);
    expect(toc).toMatch(/sticky top-24/);
    expect(toc).toMatch(/-80px 0px -80% 0px/);
    expect(toc).toMatch(/IntersectionObserver/);
  });

  it("S9: rail sits below progress/header; drawer above with backdrop", () => {
    const toc = read(TOC_PATH);
    // Rail nav must not claim high z-index (stays below fixed progress z-50)
    expect(toc).not.toMatch(/z-50/);
    expect(toc).not.toMatch(/z-\[60\]/);
  });

  it("TOC scoping: headings collected from prose container with id filter", () => {
    const toc = read(TOC_PATH);
    // Scoped to prose container (not document-wide h2,h3)
    expect(toc).toMatch(/data-prose-container|prose-container|article-prose/);
    // Only id-bearing headings qualify
    expect(toc).toMatch(/h2\[id\]|h3\[id\]|el\.id/);
  });
});
