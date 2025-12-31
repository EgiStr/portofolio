import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@ecosystem/database";

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingTime: number;
  viewCount?: number;
}

async function getRecentPosts(): Promise<Post[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      include: {
        _count: { select: { views: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
    });

    return posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || "",
      publishedAt:
        post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      readingTime: post.readingTime,
      viewCount: post._count.views,
    }));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function HomePage() {
  const recentPosts = await getRecentPosts();

  return (
    <div>
      {/* Hero Section */}
      <section className="mb-16">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          hey, I&apos;m Eggi 👋
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          I&apos;m a full-stack developer who loves building for the web. I
          write about software development, design patterns, and the tools I use
          to ship products.
        </p>
      </section>

      {/* Recent Posts */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Recent Posts
        </h2>
        <div className="space-y-6">
          {recentPosts.map((post) => (
            <article key={post.slug} className="group">
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                  <h3 className="text-foreground font-medium group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {post.readingTime} min read
                  </span>
                </div>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {post.excerpt}
                </p>
                <span className="text-xs text-muted-foreground mt-2 block">
                  {formatDate(post.publishedAt)}
                </span>
              </Link>
            </article>
          ))}
        </div>

        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-primary text-sm mt-8 group"
        >
          View all posts
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>
    </div>
  );
}
