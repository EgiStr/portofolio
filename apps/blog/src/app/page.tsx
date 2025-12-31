import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    // In production, use absolute URL or environment variable
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/api/posts?limit=5`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
    // Return placeholder data if fetch fails
    return [
      {
        slug: "building-personal-ecosystem",
        title: "Building a Personal Digital Ecosystem",
        excerpt:
          "How I built a multi-domain personal ecosystem with Next.js, Prisma, and PostgreSQL.",
        publishedAt: "2024-01-15T00:00:00.000Z",
        readingTime: 8,
      },
    ];
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
