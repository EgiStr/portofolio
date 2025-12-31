import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

export const dynamic = "force-dynamic";

// GET /api/posts - Get all published blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("q");

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

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}
