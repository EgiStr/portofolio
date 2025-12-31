import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

export const dynamic = "force-dynamic";

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/posts - Get all published blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("q");

    // Check database connection implicitly via a query
    const posts = await prisma.blogPost.findMany({
      where: {
        published: true,
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { excerpt: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        tags: true,
        _count: { select: { views: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });

    return NextResponse.json(posts, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts", details: (error as Error).message },
      { status: 500, headers: corsHeaders },
    );
  }
}
