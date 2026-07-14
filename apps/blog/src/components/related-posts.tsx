import Link from "next/link";
import { prisma } from "@ecosystem/database";
import { Clock, Eye } from "lucide-react";

interface RelatedPostTag {
  id: string;
  name: string;
}

interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingTime: number;
  viewCount: number;
  tags: RelatedPostTag[];
}

interface RelatedPostsProps {
  currentSlug: string;
  tags: { id: string; name: string }[];
}

async function getRelatedPosts(
  currentSlug: string,
  tags: { id: string; name: string }[],
): Promise<RelatedPost[]> {
  if (!tags || tags.length === 0) return [];

  const tagIds = tags.map((t) => t.id);

  try {
    const related = await prisma.blogPost.findMany({
      where: {
        published: true,
        slug: { not: currentSlug },
        tags: { some: { id: { in: tagIds } } },
      },
      include: {
        tags: true,
        _count: { select: { views: true } },
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
    });

    return related.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || "",
      publishedAt: p.publishedAt?.toISOString() || p.createdAt.toISOString(),
      readingTime: p.readingTime,
      viewCount: p._count.views,
      tags: p.tags.map((t) => ({ id: t.id, name: t.name })),
    }));
  } catch (error) {
    console.error("Error fetching related posts:", error);
    return [];
  }
}

export async function RelatedPosts({ currentSlug, tags }: RelatedPostsProps) {
  const posts = await getRelatedPosts(currentSlug, tags);

  if (posts.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h2 className="text-xl font-bold text-foreground mb-6">Related Posts</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block p-4 rounded-lg border border-border/50 bg-card hover:border-primary/30 transition-colors"
          >
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.readingTime} min
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {post.viewCount.toLocaleString()}
              </span>
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {post.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag.id}
                    className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
