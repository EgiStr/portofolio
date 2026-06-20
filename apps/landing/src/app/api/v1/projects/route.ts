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
 * GET /api/v1/projects — authenticated list of published projects.
 * Requires an API key in the `x-api-key` header.
 */
export const GET = withApiKey(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1),
      100,
    );

    const projects = await prisma.project.findMany({
      where: {
        status: "PUBLISHED",
        ...(featured === "true" && { featured: true }),
      },
      include: {
        techStack: { select: { id: true, name: true, icon: true } },
        author: { select: { name: true } },
      },
      orderBy: [
        { featured: "desc" },
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    return apiSuccess({
      count: projects.length,
      projects: projects.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        longDescription: p.longDescription,
        imageUrl: p.imageUrl,
        liveUrl: p.liveUrl,
        githubUrl: p.githubUrl,
        featured: p.featured,
        status: p.status,
        clicks: p.clicks,
        tech: p.techStack.map((t) => t.name),
        author: p.author?.name ?? null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (err) {
    console.error("[api/v1/projects] failed", err);
    return apiError(
      err instanceof Error ? err.message : "Failed to fetch projects",
      500,
    );
  }
});

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}
