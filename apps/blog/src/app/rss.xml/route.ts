import { prisma } from "@ecosystem/database";
import { getSettings } from "@ecosystem/config";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://blog.eggisatria.dev";

/**
 * GET /rss.xml — RSS 2.0 feed of the most recent 20 published blog posts.
 * Hand-rolled (no library) because the feed format is simple and stable.
 */
export async function GET() {
  const [settings, posts] = await Promise.all([
    getSettings(),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        publishedAt: true,
        updatedAt: true,
        author: { select: { name: true, email: true } },
        tags: { select: { name: true, slug: true } },
      },
    }),
  ]);

  const siteTitle = settings.siteTitle || settings.name || "Blog";
  const siteDescription =
    settings.siteDescription || settings.heroDescription || "Latest posts";
  const language = "en";

  const lastBuildDate = posts[0]?.publishedAt
    ? new Date(posts[0].publishedAt).toUTCString()
    : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date(post.updatedAt).toUTCString();
      const authorName = post.author?.name || settings.name || "Anonymous";
      const categories = post.tags
        .map((t) => `<category>${escapeXml(t.name)}</category>`)
        .join("");
      const description = post.excerpt || stripMd(post.content).slice(0, 280);
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(authorName)}</author>
      <dc:creator>${escapeXml(authorName)}</dc:creator>
      ${categories}
      <description><![CDATA[${description}]]></description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>${language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Very rough Markdown→text for descriptions — strips fences, links, emphasis. */
function stripMd(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#*_>~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
