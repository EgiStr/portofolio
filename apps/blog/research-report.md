# Engineering Blog Feature Research Report

> **Target:** blog.eggisatria.dev  
> **Stack:** Next.js 15.2 App Router, react-markdown + remark-gfm, Prisma + PostgreSQL, Tailwind CSS, dark theme (prose-invert)  
> **Date:** July 14, 2026

---

## Executive Summary

The blog currently has a solid foundation:  
- ✅ react-markdown for Markdown content (stored in Prisma DB)  
- ✅ rehype-slug + rehype-autolink-headings for heading anchors  
- ✅ rehype-pretty-code + shiki installed but **not wired into react-markdown**  
- ✅ remark-gfm for tables, task lists, strikethrough  
- ✅ Basic JSON-LD (BlogPosting)  
- ✅ Open Graph / Twitter cards via `generateMetadata`  

**Key gaps identified:** No math rendering, no syntax highlighting in blog posts, no table of contents, no reading progress bar, no code copy button, no related posts, breadcrumb JSON-LD missing, no heading anchor visual indicators.

Below are research-backed recommendations for each feature, ranked by implementation priority.

---

## 1. LaTeX Math Rendering

### Options Compared

| Approach | Bundle Size | SSR | Speed | Maintenance |
|----------|------------|-----|-------|-------------|
| **remark-math + rehype-katex** | ~280KB gzip (CSS + fonts) | ✅ Full SSR | ⚡ Very fast (CSS-only, no JS runtime) | ✅ Active (remarkjs org) |
| rehype-mathjax | ~500KB+ gzip | ✅ SSR | 🐌 Slower (JS runtime for rendering) | ✅ Active |
| Custom plugin | Variable | Depends | Depends | ❌ You maintain it |

### Recommendation: `remark-math` + `rehype-katex`

**Packages:**
```
npm install remark-math rehype-katex
```

- KaTeX CSS must be imported globally (not per-component): `import 'katex/dist/katex.min.css'`
- Works as remark + rehype plugins in react-markdown:
```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm, remarkMath]}
  rehypePlugins={[rehypeKatex]}
>
```

**Why KaTeX over MathJax:**
1. **2-3x faster** — KaTeX renders synchronously at build/SSR time; MathJax needs async JS evaluation
2. **Smaller bundle** — KaTeX CSS (~130KB) vs MathJax full JS bundle (~500KB+)
3. **Better dark theme** — KaTeX CSS can be inverted via `prose-invert`; MathJax requires custom theme config
4. **No FOUT** (Flash of Unstyled Text) — KaTeX renders server-side, HTML arrives pre-rendered

**Bundle Impact:** ~280KB gzip (katex CSS + fonts). The CSS should be loaded via `import` in `globals.css` or `layout.tsx`. For the dark theme, KaTeX outputs HTML with inline styles that are NOT automatically inverted by `prose-invert` — you'll need custom CSS overrides for `.katex` elements in dark mode.

**CSP Consideration:** KaTeX uses inline styles (`style-src 'unsafe-inline'` — already in your CSP). No issues.

**Implementation Complexity:** Low  
**SSR Compatibility:** ✅ Full

### Dark Theme CSS Override for KaTeX
```css
/* In globals.css */
.dark .katex {
  color: hsl(var(--foreground));
}
.dark .katex .mathnormal {
  color: hsl(var(--foreground));
}
/* KaTeX uses inline styles for colors — force white in dark mode */
.dark .katex .katex-html * {
  color: hsl(var(--foreground)) !important;
}
```

---

## 2. Syntax Highlighting

### Current State
- `rehype-pretty-code` v0.14 and `shiki` v1.22 are **installed** but only in `next.config.mjs` for the MDX pipeline
- The `MarkdownContent` component (used for blog posts from DB) does NOT use any syntax highlighting — code blocks render as plain `<pre><code>` with no language-specific styling
- You're missing: language labels, line numbers, highlighted lines, copy buttons, proper dark theme

### Options Compared

| Approach | Bundle | SSR | Features | Perf |
|----------|--------|-----|----------|------|
| **rehype-pretty-code + shiki** (via rehype plugin) | ~1-2MB shiki (server-only) | ✅ SSR/SSG | Line nums, highlights, word highlight, multiple themes, diff | ⚡ Fast (build/SSR time) |
| react-syntax-highlighter (Prism) | ~250KB client + 200KB+ per language | ❌ Client only | Basic: line nums, themes | 🐌 Heavy client bundle |
| Custom shiki `codeToHtml` | ~1-2MB shiki (server) | ✅ SSR | All shiki features | ⚡ Fast |
| Shiki + @shikijs/rehype | ~1-2MB (server) | ✅ SSR | Full shiki features | ⚡ Fast |

### Recommendation: Wire up `rehype-pretty-code` into `markdown-content.tsx`

Since you already have it installed, this is the highest ROI change:

**Implementation Plan:**

Create a server-side wrapper or add `rehypePrettyCode` to the rehype plugins in `MarkdownContent`:

```tsx
// markdown-content.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

const prettyCodeOptions = {
  theme: {
    dark: "github-dark",
    light: "github-light",
  },
  keepBackground: false,
  grid: true, // enables line numbers in grid layout
  defaultLang: "plaintext",
};

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          [rehypeKatex],
          [rehypePrettyCode, prettyCodeOptions],
        ]}
        components={{
          // ... your existing overrides
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

**Important:** `rehype-pretty-code` works as a rehype plugin in react-markdown, but it transforms `<pre><code>` blocks into highlighted HTML **during the unified pipeline**. This means all highlighting happens at render time (SSR on the server), and the client receives already-highlighted HTML. Zero client JS needed.

**CSS for rehype-pretty-code dark mode:**
```css
/* In globals.css */
pre {
  @apply rounded-lg border border-border overflow-x-auto p-4;
}

/* rehype-pretty-code figure container */
[data-rehype-pretty-code-figure] {
  @apply relative my-4;
}

[data-rehype-pretty-code-figure] pre {
  @apply px-0 py-4;
}

[data-rehype-pretty-code-figure] code {
  @apply text-sm leading-relaxed;
  counter-reset: line;
}

/* Line numbers */
[data-rehype-pretty-code-figure] code[data-line-numbers] > [data-line]::before {
  counter-increment: line;
  content: counter(line);
  @apply inline-block w-4 mr-4 text-right text-muted-foreground/40;
}

/* Highlighted lines */
[data-rehype-pretty-code-figure] [data-highlighted-line] {
  @apply bg-primary/10 border-l-2 border-primary;
}

/* Word highlighting */
[data-rehype-pretty-code-figure] [data-highlighted-chars] {
  @apply bg-primary/20 rounded;
}

/* Figure caption (filename) */
[data-rehype-pretty-code-title] {
  @apply text-xs text-muted-foreground px-4 py-1.5 bg-secondary rounded-t-lg border border-border/50 border-b-0;
}
```

**Why NOT react-syntax-highlighter:**
- Client-side only — hydration mismatch risk with SSR
- Large bundle — importing language grammars adds ~200KB per language
- No diff/word highlighting without custom code
- The code is already server-rendered via react-markdown, so a rehype plugin is architecturally cleaner

**Bundle Impact:** Negligible for client — shiki runs on server (rehype plugin). The `shiki` package is never sent to the browser.

**Implementation Complexity:** Low (already installed, just needs wiring)  
**SSR Compatibility:** ✅ Full

---

## 3. Table of Contents

### Options Compared

| Approach | Features | Bundle | Complexity |
|----------|----------|--------|------------|
| **Custom extract from markdown** | Full control, scrollspy | 0 deps | Medium |
| `react-markdown-toc` | Server + Client, scrollspy | ~3KB | Low |
| `remark-toc` | Server-side only, injects TOC into markdown | ~2KB | Low |
| `rehype-extract-toc` | Extracts from rehype tree | ~1KB | Low |

### Recommendation: Custom Heading Extraction + IntersectionObserver Scrollspy

Given your existing `rehype-slug` setup (headings already have IDs), build a lightweight TOC:

**Server-side TOC generation (RSC-compatible):**
```tsx
// lib/extract-toc.ts
export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractToc(markdown: string): TocItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[`*_~\[\]]/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    if (level >= 2 && level <= 4) {
      items.push({ id, text, level });
    }
  }

  return items;
}
```

**Client-side scrollspy hook:**
```tsx
// hooks/use-active-heading.ts
"use client";
import { useEffect, useState } from "react";

export function useActiveHeading(headingIds: string[]) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    headingIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headingIds]);

  return activeId;
}
```

**TOC Component:**
```tsx
// components/table-of-contents.tsx
"use client";
import { TocItem } from "@/lib/extract-toc";
import { useActiveHeading } from "@/hooks/use-active-heading";
import { cn } from "@/lib/utils";

export function TableOfContents({ items }: { items: TocItem[] }) {
  const activeId = useActiveHeading(items.map((i) => i.id));

  if (items.length < 4) return null;

  return (
    <nav aria-label="Table of Contents">
      <h2 className="text-sm font-semibold text-foreground mb-3">
        On this page
      </h2>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "block text-sm transition-colors py-0.5",
                item.level === 3 ? "pl-4" : "",
                activeId === item.id
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

**Mobile Strategy:** Use a collapsible "On this page" menu or position it below the article header on screens <1024px. For very narrow screens, implement a floating bottom sheet or dismissable drawer.

**Bundle Impact:** Zero additional deps (IntersectionObserver is native)  
**Implementation Complexity:** Medium  
**SSR Compatibility:** ✅ Full (TOC extracted server-side, scrollspy client-only)

---

## 4. Reading Progress Bar

### Options Compared

| Approach | Bundle | SSR | Features |
|----------|--------|-----|----------|
| **Custom IntersectionObserver** | 0 deps (~1KB) | ✅ SSR | Full control, any design |
| `nextjs-toploader` | ~5KB | ✅ SSR | Route change bar (not scroll) |
| `next-nprogress-bar` | ~8KB | ✅ SSR | Route change bar (not scroll) |

### Recommendation: Custom IntersectionObserver Implementation

Two types of progress bars needed:

**A. Page scroll progress (reading position):**
```tsx
// components/reading-progress.tsx
"use client";
import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min((scrollTop / docHeight) * 100, 100));
      }
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-0.5 z-50">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
```

**B. Route transition progress bar (page loading):**
```tsx
// components/navigation-progress.tsx
"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return (
    <div className="fixed top-0 left-0 w-full h-0.5 z-50">
      <div
        ref={ref}
        className="h-full bg-primary transition-all duration-500 ease-out"
        style={{ width: loading ? "90%" : "0%", opacity: loading ? 1 : 0 }}
      />
    </div>
  );
}
```

**Note:** The scroll progress bar is more useful for a blog (shows reading position). The route progress bar matters if your pages are slow to load.

**Bundle Impact:** Zero deps  
**Implementation Complexity:** Low  
**SSR Compatibility:** ✅ (client component, no SSR issues)

---

## 5. Code Copy Button

### Options Compared

| Approach | Bundle | UX | Complexity |
|----------|--------|----|------------|
| **rehype-pretty-code transformers** (official) | 0 extra | ✅ Built into shiki | Low |
| Custom React component wrapping `<pre>` | 0 deps | ✅ Full control | Medium |
| `@shikijs/transformers` + `transformerCopyButton` | ~1KB | ✅ | Low |

### Recommendation: rehype-pretty-code's built-in `transformerCopyButton`

The `@rehype-pretty/transformers` package provides a `transformerCopyButton` that integrates directly with `rehype-pretty-code`:

```ts
import { transformerCopyButton } from "@rehype-pretty/transformers";

const prettyCodeOptions = {
  transformers: [
    transformerCopyButton({
      visibility: "hover", // "always" | "hover"
      feedbackDuration: 3_000,
      jsx: true, // for React/Next.js
    }),
  ],
};
```

This adds a copy button to every code block that:
- Appears on hover (or always visible)
- Shows a checkmark for 3 seconds after clicking
- Uses `navigator.clipboard.writeText()`
- Falls back gracefully (copy still works if JS fails)

**Important:** The transformer approach requires `rehype-pretty-code` to be configured as a rehype plugin with `jsx: true`. The button is rendered as part of the shiki transformation, meaning it's server-rendered HTML with client-side JS for the click handler.

**Alternative (if you want full visual control):** Add a button in the `pre` component override:
```tsx
pre: ({ children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const code = // extract text from children
  return (
    <div className="relative group">
      <button
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 ..."
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
};
```

**Bundle Impact:** Minimal (~1KB for the transformer)  
**Implementation Complexity:** Low  
**SSR Compatibility:** ✅ (button is server-rendered HTML, click handler is client-only)

---

## 6. Related Posts

### Option: Prisma Query with Tag Overlap

**Recommendation:** Use Prisma's built-in relation filtering to find posts with overlapping tags:

```ts
// lib/related-posts.ts
import { prisma } from "@ecosystem/database";

export async function getRelatedPosts(
  currentSlug: string,
  tagIds: string[],
  limit: number = 3
) {
  if (tagIds.length === 0) return [];

  const posts = await prisma.blogPost.findMany({
    where: {
      slug: { not: currentSlug },
      published: true,
      tags: {
        some: {
          id: { in: tagIds },
        },
      },
    },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      publishedAt: true,
      readingTime: true,
      coverImage: true,
      tags: {
        select: { id: true, name: true },
      },
      _count: {
        select: { views: true },
      },
    },
    orderBy: [
      { publishedAt: "desc" },
    ],
    take: limit,
  });

  // Sort by number of matching tags for relevance
  return posts
    .map((post) => ({
      ...post,
      matchCount: post.tags.filter((t) => tagIds.includes(t.id)).length,
      viewCount: post._count.views,
    }))
    .sort((a, b) => b.matchCount - a.matchCount || b.viewCount - a.viewCount)
    .slice(0, limit);
}
```

**To improve relevance scoring,** add a raw SQL field for tag overlap count (PostgreSQL):

```ts
const posts = await prisma.$queryRaw`
  SELECT 
    bp.slug, bp.title, bp.excerpt, bp."publishedAt", bp."readingTime", bp."coverImage",
    COUNT(bt."blogTagId") as match_count,
    (SELECT COUNT(*) FROM "blog_views" bv WHERE bv."postId" = bp.id) as view_count
  FROM "blog_posts" bp
  JOIN "_BlogPostToBlogTag" bt ON bt."BlogPostId" = bp.id
  WHERE bp.published = true 
    AND bp.slug != ${currentSlug}
    AND bt."blogTagId" IN (${tagIds.join(",")})
  GROUP BY bp.id
  ORDER BY match_count DESC, view_count DESC
  LIMIT ${limit}
`;
```

**Alternative simpler query** (for minimal DB impact):
```ts
// Use the current post's tags to filter
const relatedPosts = await prisma.blogPost.findMany({
  where: {
    published: true,
    slug: { not: currentSlug },
    tags: {
      some: {
        id: { in: currentTagIds },
      },
    },
  },
  orderBy: { publishedAt: "desc" },
  take: 4,
});
```

**Performance Optimization:**
1. Use `cache()` from Next.js to deduplicate requests within a render
2. Add a database index on `(published, publishedAt)` for efficient filtering
3. Keep `tagIds` as an explicit join table for fast lookups (already done in your schema via implicit many-to-many)

**Bundle Impact:** Zero (server-only)  
**Implementation Complexity:** Low  
**SSR Compatibility:** ✅

---

## 7. SEO Enhancements

### 7a. Breadcrumb JSON-LD

Your current BlogPosting JSON-LD is good. Add BreadcrumbList for richer SERP display:

```tsx
// In blog/[slug]/page.tsx
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${baseUrl}`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Blog",
      item: `${baseUrl}/blog`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: post.title,
    },
  ],
};
```

**Package Recommendation:** Install `schema-dts` for TypeScript types:
```
npm install -D schema-dts
```

Then create a typed JSON-LD component:
```tsx
// components/json-ld.tsx
import type { Thing, WithContext } from "schema-dts";

interface JsonLdProps {
  schema: WithContext<Thing>;
}

export function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
```

### 7b. Improve BlogPosting JSON-LD

Enhance your existing schema with additional fields Google uses for rich results:

```ts
const blogPostingSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.excerpt,
  image: post.coverImage ? [post.coverImage] : undefined,
  datePublished: post.publishedAt,
  dateModified: post.updatedAt || post.publishedAt,
  author: {
    "@type": "Person",
    name: post.author?.name || "Eggi Satria",
    url: "https://eggisatria.dev",
  },
  publisher: {
    "@type": "Person",
    name: "Eggi Satria",
  },
  url: `${baseUrl}/blog/${slug}`,
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${baseUrl}/blog/${slug}`,
  },
  wordCount: post.content.split(/\s+/).length,
  keywords: post.tags?.map((t) => t.name).join(", "),
};
```

### 7c. Heading Anchor Visual Style

You already have `rehype-slug` + `rehype-autolink-headings` in the MDX config, but the `behavior: "wrap"` means the heading text wraps in an `<a>` tag. For better UX:

```ts
// In markdown-content.tsx rehype plugins:
[rehypeAutolinkHeadings, {
  behavior: "append",  // adds link after heading text
  properties: {
    className: ["heading-anchor"],
    ariaHidden: "true",
    tabIndex: -1,
  },
  content: {
    type: "element",
    tagName: "span",
    properties: { className: ["heading-anchor-icon"] },
    children: [{ type: "text", value: "#" }],
  },
}]
```

```css
/* In globals.css */
.heading-anchor {
  @apply ml-2 text-muted-foreground/30 hover:text-primary no-underline;
  opacity: 0;
  transition: opacity 0.15s ease;
}

h1:hover .heading-anchor,
h2:hover .heading-anchor,
h3:hover .heading-anchor,
h4:hover .heading-anchor {
  opacity: 1;
}
```

This gives the familiar "anchor appears on hover" pattern used by GitHub, Stripe, Vercel docs.

### 7d. Other SEO Improvements

- **Canonical URLs** — Already done in `generateMetadata` ✅
- **Sitemap** — Already in `sitemap.ts` ✅
- **RSS Feed** — Already in `rss.xml/` ✅
- **Robots.txt** — Already in `robots.ts` ✅
- **Open Graph images** — Already have it with `/api/og` fallback ✅

**Missing:** Add `dateModified` to both metadata and JSON-LD (currently missing in your schema).

**Bundle Impact:** Zero  
**Implementation Complexity:** Low  
**SSR Compatibility:** ✅

---

## Feature Priority Matrix

| Priority | Feature | Effort | Impact | Dependencies |
|----------|---------|--------|--------|--------------|
| 🔴 P0 | Wire up rehype-pretty-code | Low | High | None (already installed) |
| 🔴 P0 | Code copy button | Low | High | Requires rehype-pretty-code |
| 🟡 P1 | Table of Contents | Medium | High | rehype-slug (already installed) |
| 🟡 P1 | Reading Progress Bar | Low | Medium | None |
| 🟡 P1 | Breadcrumb JSON-LD | Low | Medium | schema-dts (new dep) |
| 🟢 P2 | LaTeX Math Rendering | Low | Medium | remark-math, rehype-katex |
| 🟢 P2 | Related Posts | Low | Medium | None |
| 🟢 P2 | Heading anchor stylings | Low | Low | Already configured |

---

## Bundle Impact Summary

| Package | Size (gzip) | Runtime | Notes |
|---------|-------------|---------|-------|
| `rehype-katex` + `katex` CSS | ~280KB | Server + CSS | CSS only on client |
| `remark-math` | ~8KB | Server | Remark plugin |
| `rehype-pretty-code` + `shiki` | Already installed | Server | Zero client cost |
| `@rehype-pretty/transformers` | ~1KB | Server | Copy button |
| `schema-dts` | ~0KB (types only) | Dev only | TypeScript types |
| `react-intersection-observer` | ~1.5KB | Client | Only if not using native API |

Since your blog content is rendered via `react-markdown` (not MDX), all remark/rehype plugins run at **render time on the server** (RSC). The client receives pre-rendered HTML. This means **zero additional JS bundle cost** for all remark/rehype plugins — they're build-time/server-only dependencies.

---

## Key Architectural Decisions

### How react-markdown + rehype-pretty-code interact

Your `markdown-content.tsx` is a `"use client"` component, but it uses `ReactMarkdown` from `react-markdown`. When rendered as part of a Server Component (your `page.tsx`), the Markdown processing still happens on the server. However, since `rehypePrettyCode` needs **shiki** which has Node.js dependencies (grammar files, themes), it will fail if executed in a pure client context.

**Solution:** Either:
1. **Move markdown processing to a server component** — Create a server-only wrapper
2. **Pre-process on the server** — Use `unified()` pipeline in a server action
3. **Keep "use client" but only on server** — Since Next.js 15 renders client components on the server first, `rehype-katex` and `rehype-pretty-code` will work because they execute during the server render pass

**Recommended approach:** Remove `"use client"` from `MarkdownContent` and let it be a server component. React-markdown and its plugins will execute on the server. If you need client interactivity (copy button), split it into a separate client sub-component.

```tsx
// markdown-content.tsx — SERVER COMPONENT (remove "use client")
import ReactMarkdown from "react-markdown";
// ... all plugins run server-side

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }], [rehypeKatex], [rehypePrettyCode, prettyCodeOptions]]}
    >
      {content}
    </ReactMarkdown>
  );
}
```

### CSP Note for KaTeX

Your existing CSP allows `style-src 'unsafe-inline'` which is required for KaTeX (and Tailwind). No changes needed.

---

## NPM Packages to Install

```bash
# Math rendering
npm install remark-math rehype-katex

# Type-safe JSON-LD (dev only)
npm install -D schema-dts

# Copy button transformer (if using @rehype-pretty/transformers)
npm install @rehype-pretty/transformers
```

**Packages already installed (no action needed):**
- `rehype-pretty-code` ✅ (needs wiring into react-markdown)
- `shiki` ✅ (used by rehype-pretty-code)
- `rehype-slug` ✅
- `rehype-autolink-headings` ✅
- `remark-gfm` ✅

---

## Files to Create/Modify

| File | Action | For |
|------|--------|-----|
| `src/components/markdown-content.tsx` | **Modify** | Wire rehype-pretty-code, remark-math, rehype-katex |
| `src/components/table-of-contents.tsx` | **Create** | TOC with scrollspy |
| `src/hooks/use-active-heading.ts` | **Create** | IntersectionObserver scroll tracking |
| `src/lib/extract-toc.ts` | **Create** | Extract headings from markdown |
| `src/components/reading-progress.tsx` | **Create** | Scroll progress bar |
| `src/components/json-ld.tsx` | **Create** | Typed JSON-LD component |
| `src/components/code-block.tsx` | **Create** | Copy button wrapper (if not using transformer) |
| `src/lib/related-posts.ts` | **Create** | Prisma related posts query |
| `src/app/globals.css` | **Modify** | Add KaTeX dark mode, code block CSS, heading anchors |
| `src/app/blog/[slug]/page.tsx` | **Modify** | Add BreadcrumbList JSON-LD, related posts section, TOC |

---

## Recommendation

### Phase 1 (Immediate — < 2 hours)
1. Wire up `rehype-pretty-code` into `MarkdownContent` (already installed!)
2. Add heading anchor CSS styling
3. Add reading progress bar
4. Add BreadcrumbList JSON-LD + enhance BlogPosting schema

### Phase 2 (This week — < 4 hours)
5. Add Table of Contents component with scrollspy
6. Add code copy button (via transformer or custom component)
7. Add Related Posts section

### Phase 3 (Nice to have)
8. Add LaTeX math rendering (remark-math + rehype-katex)
9. Add `wordCount` and `keywords` to JSON-LD

All features are SSR-compatible, mobile-friendly (with the noted considerations), and have minimal bundle impact since they either run server-side or use zero-dependency native APIs.
