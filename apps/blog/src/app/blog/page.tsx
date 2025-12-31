"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingTime: number;
  tags?: { id: string; name: string }[];
  viewCount?: number;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async (query: string = "") => {
    setIsLoading(true);
    try {
      const searchParam = query ? `?q=${encodeURIComponent(query)}` : "";
      const response = await fetch(`/api/posts${searchParam}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPosts]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-2">Blog</h1>
      <p className="text-muted-foreground mb-8">
        Thoughts on software development, design, and technology.
      </p>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-secondary rounded w-3/4 mb-2" />
              <div className="h-4 bg-secondary rounded w-full mb-2" />
              <div className="h-3 bg-secondary rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Posts List */}
      {!isLoading && (
        <div className="space-y-8">
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No posts found{searchQuery && ` for "${searchQuery}"`}
            </p>
          ) : (
            posts.map((post) => (
              <article key={post.slug} className="group">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <h2 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {post.readingTime} min read
                    </span>
                    {post.viewCount !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {post.viewCount.toLocaleString()} views
                      </span>
                    )}
                    {post.tags && (
                      <div className="flex gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
