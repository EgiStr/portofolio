import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      {
        ...post,
        viewCount: post._count.views,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("Failed to fetch post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post", details: (error as Error).message },
      { status: 500, headers: corsHeaders },
    );
  }
}

// POST /api/posts/[slug] - Increment view count
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

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to record view:", error);
    return NextResponse.json(
      { error: "Failed to record view", details: (error as Error).message },
      { status: 500, headers: corsHeaders },
    );
  }
}
