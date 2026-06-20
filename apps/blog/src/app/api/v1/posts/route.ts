import { NextRequest } from "next/server";
import { prisma } from "@ecosystem/database";
import { withApiKey } from "@/lib/middleware/with-api-key";
import { apiSuccess, apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

/**
 * GET /api/v1/posts — authenticated list of published blog posts.
 * Requires an API key in the `x-api-key` header.
 *
 * Query params:
 *   - limit: 1..100 (default 20)
 *   - q:     substring search across title, excerpt, content (case-insensitive)
 *   - tag:   filter by tag slug
 */
export const GET = withApiKey(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1),
      100,
    );
    const q = searchParams.get("q")?.trim() || "";
    const tag = searchParams.get("tag")?.trim() || "";

    const posts = await prisma.blogPost.findMany({
      where: {
        published: true,
        ...(q && {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        }),
        ...(tag && {
          tags: { some: { slug: tag } },
        }),
      },
      include: {
        author: { select: { name: true } },
        tags: { select: { name: true, slug: true } },
        _count: { select: { views: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });

    return apiSuccess({
      count: posts.length,
      posts: posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        coverImage: p.coverImage,
        publishedAt: p.publishedAt,
        readingTime: p.readingTime,
        author: p.author?.name ?? null,
        tags: p.tags.map((t) => ({ name: t.name, slug: t.slug })),
        views: p._count.views,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (err) {
    console.error("[api/v1/posts] failed", err);
    return apiError(
      err instanceof Error ? err.message : "Failed to fetch posts",
      500,
    );
  }
});

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}
