import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const BLOG_ROOT = process.cwd();
const COMPONENTS_DIR = path.join(BLOG_ROOT, "src/components");
const DRAWER_PATH = path.join(COMPONENTS_DIR, "toc-drawer.tsx");
const ARTICLE_PAGE_PATH = path.join(BLOG_ROOT, "src/app/blog/[slug]/page.tsx");

function read(p: string): string {
  return fs.readFileSync(p, "utf8");
}

describe("mobile TOC drawer contract (S3/S4/S6)", () => {
  it("S3: drawer module exists with trigger + dialog a11y contract", () => {
    expect(fs.existsSync(DRAWER_PATH)).toBe(true);
    const src = read(DRAWER_PATH);
    expect(src).toMatch(/TocDrawer/);
    expect(src).toMatch(/aria-expanded/);
    expect(src).toMatch(/aria-controls/);
    expect(src).toMatch(/role="dialog"/);
    expect(src).toMatch(/Table of contents/);
  });

  it("S3: drawer supports backdrop, close button, and Esc dismiss + scroll lock + focus", () => {
    const src = read(DRAWER_PATH);
    expect(src).toMatch(/backdrop|Backdrop|onClick.*close|close.*backdrop/i);
    expect(src).toMatch(/Escape|Esc|key === "Escape"|key==="Escape"/);
    expect(src).toMatch(
      /overflow.*hidden|scroll.*lock|lock.*scroll|body\.style/i,
    );
    expect(src).toMatch(/focus|autoFocus|\.focus\(\)/);
  });

  it("S3/S4: trigger is floating below lg only; panel width bounded; no reserved gutter", () => {
    const src = read(DRAWER_PATH);
    expect(src).toMatch(/lg:hidden/);
    expect(src).toMatch(/fixed/);
    // Panel width min(20rem, 85vw) or equivalent tailwind max-w + w token
    expect(src).toMatch(/85vw|20rem|max-w-xs|w-80/);
    // Drawer must return null when headings < 3 (S6 gate inside component)
    expect(src).toMatch(/headings\.length < 3|length < 3/);
    // Article page must mount the drawer only for long posts
    const page = read(ARTICLE_PAGE_PATH);
    expect(page).toMatch(/TocDrawer|toc-drawer/);
  });

  it("S6: short posts render no trigger or drawer", () => {
    const src = read(DRAWER_PATH);
    // Null-guard on short heading lists (shared <3 rule, no second threshold)
    expect(src).toMatch(/return null/);
    expect(src).toMatch(/< 3/);
  });

  it("drawer reuses heading-collection logic (no second parser)", () => {
    const src = read(DRAWER_PATH);
    // Must import shared hook/list from table-of-contents or query the same scoped selectors
    expect(src).toMatch(
      /useTocHeadings|TableOfContents|table-of-contents|data-prose-container|h2\[id\]|h3\[id\]/,
    );
  });
});
