import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";
import { Prisma } from "@prisma/client";

// GET /api/admin/posts - List all blog posts (paginated)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const published = searchParams.get("published");
    const search = searchParams.get("q");

    const where: Prisma.BlogPostWhereInput = {
      ...(published !== null && { published: published === "true" }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { excerpt: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: { tags: true, _count: { select: { views: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}

// Calculate reading time from content
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

// POST /api/admin/posts - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, slug, excerpt, content, coverImage, published, tags } = body;

    // Validate required fields
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug, content" },
        { status: 400 },
      );
    }

    const readingTime = calculateReadingTime(content);

    // Handle tags: create new tags if they don't exist
    const tagRecords = await Promise.all(
      (tags as string[])?.map(async (tagName: string) => {
        const slug = tagName.toLowerCase().replace(/\s+/g, "-");
        return prisma.blogTag.upsert({
          where: { slug },
          update: {},
          create: { name: tagName, slug },
        });
      }) || [],
    );

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        published: published || false,
        publishedAt: published ? new Date() : null,
        readingTime,
        authorId: session.user.id,
        tags: { connect: tagRecords.map((t) => ({ id: t.id })) },
      },
      include: { tags: true },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    // Handle unique constraint violation for slug
    if ((error as any).code === "P2002") {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
