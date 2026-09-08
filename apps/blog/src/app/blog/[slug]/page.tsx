import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, Eye } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShareButtons } from "@/components/share-buttons";
import { prisma } from "@ecosystem/database";
import { MarkdownContent } from "@/components/markdown-content";
import { ReadingProgress } from "@/components/reading-progress";
import { TableOfContents } from "@/components/table-of-contents";
import { RelatedPosts } from "@/components/related-posts";

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  readingTime: number;
  viewCount: number;
  coverImage?: string | null;
  tags?: { id: string; name: string }[];
  author?: { name: string };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug, published: true },
      include: {
        tags: true,
        author: { select: { name: true } },
        _count: { select: { views: true } },
      },
    });

    if (!post) return null;

    return {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content,
      publishedAt:
        post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      readingTime: post.readingTime,
      viewCount: post._count.views,
      coverImage: post.coverImage,
      tags: post.tags,
      author: post.author
        ? { name: post.author.name || "Anonymous" }
        : undefined,
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

async function recordView(slug: string) {
  try {
    // Only record views in production and NOT during build
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PHASE === "phase-production-build"
    ) {
      return;
    }

    await prisma.blogView.create({
      data: {
        post: { connect: { slug } },
      },
    });
  } catch (error) {
    console.error("Failed to record view:", error);
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://blog.eggisatria.dev";
  const url = `${baseUrl}/blog/${post.slug}`;
  const ogImage =
    post.coverImage ||
    `${baseUrl}/api/og?title=${encodeURIComponent(post.title)}`;

  return {
    title: post.title,
    description: post.excerpt,
    authors: post.author ? [{ name: post.author.name }] : undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      authors: post.author ? [post.author.name] : undefined,
      tags: post.tags?.map((tag) => tag.name),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://blog.eggisatria.dev";
  const postUrl = `${baseUrl}/blog/${slug}`;

  // JSON-LD: BlogPosting + BreadcrumbList
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage ? [post.coverImage] : [],
        datePublished: post.publishedAt,
        author: {
          "@type": "Person",
          name: post.author?.name || "Anonymous",
        },
        url: postUrl,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Blog",
            item: `${baseUrl}/blog`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: post.title,
            item: postUrl,
          },
        ],
      },
    ],
  };

  // Record view (fire and forget)
  recordView(slug);

  const isLongPost = post.readingTime > 5;

  return (
    <>
      <ReadingProgress />
      <article data-article-shell="wide" className="mx-auto w-full max-w-6xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Back Link */}
        <div className="mx-auto w-full max-w-2xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to blog
          </Link>
        </div>

        {/* Header */}
        <header className="mx-auto mb-8 w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readingTime} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.viewCount.toLocaleString()} views
            </span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 mt-4">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-1 bg-secondary text-muted-foreground rounded"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="relative mx-auto aspect-video w-full max-w-2xl mb-8 rounded-xl overflow-hidden shadow-lg">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Two-column layout for long posts: content + TOC sidebar */}
        <div
          data-article-grid
          className={
            isLongPost
              ? "mx-auto grid w-full max-w-6xl grid-cols-1 justify-center gap-8 lg:grid-cols-[minmax(0,42rem)_220px] lg:gap-12"
              : "mx-auto w-full max-w-2xl"
          }
        >
          {/* Content */}
          <div
            data-prose-container
            className="mx-auto min-w-0 w-full max-w-2xl"
          >
            <MarkdownContent content={post.content} />
          </div>

          {/* Desktop TOC sidebar for long posts */}
          {isLongPost && (
            <aside data-toc-rail className="hidden lg:block">
              <TableOfContents />
            </aside>
          )}
        </div>

        {/* Share Buttons */}
        <div className="mx-auto w-full max-w-2xl border-t border-border mt-12">
          <ShareButtons title={post.title} url={postUrl} />
        </div>

        {/* Related Posts */}
        <div className="mx-auto w-full max-w-2xl">
          <RelatedPosts currentSlug={post.slug} tags={post.tags || []} />
        </div>

        {/* Footer */}
        <footer className="mx-auto w-full max-w-2xl pt-4">
          <p className="text-muted-foreground text-sm">
            Thanks for reading! If you found this helpful, feel free to share
            it.
          </p>
        </footer>
      </article>
    </>
  );
}
