import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/posts/[slug] - Get single post by slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { slug, published: true },
      include: {
        tags: true,
        author: { select: { name: true, email: true } },
        _count: { select: { views: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...post,
      viewCount: post._count.views,
    });
  } catch (error) {
    console.error("Failed to fetch post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 },
    );
  }
}

// POST /api/posts/[slug]/view - Increment view count
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    await prisma.blogView.create({
      data: {
        post: { connect: { slug } },
        visitorIp: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record view:", error);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 },
    );
  }
}
