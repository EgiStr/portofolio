import { prisma } from "@ecosystem/database";
import BlogList from "./blog-list";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    include: {
      tags: true,
      _count: { select: { views: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  const formattedPosts = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || "",
    publishedAt:
      post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    readingTime: post.readingTime,
    tags: post.tags.map((tag) => ({ id: tag.id, name: tag.name })),
    viewCount: post._count.views,
  }));

  return <BlogList initialPosts={formattedPosts} />;
}
