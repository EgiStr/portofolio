import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

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

    // Filter by search if provided
    let filteredPosts = posts;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.excerpt.toLowerCase().includes(searchLower),
      );
    }

    return NextResponse.json(filteredPosts.slice(0, limit));
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}
