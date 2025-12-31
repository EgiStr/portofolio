"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Badge } from "@ecosystem/ui";
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  published: boolean;
  publishedAt: string | null;
  readingTime: number;
  tags: { id: string; name: string; slug: string }[];
  _count?: { views: number };
}

function formatDate(dateString: string | null) {
  if (!dateString) return "Draft";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const response = await fetch("/api/admin/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Post deleted successfully");
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    }
  }

  async function handleTogglePublish(id: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !currentStatus }),
      });

      if (response.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  published: !currentStatus,
                  publishedAt: !currentStatus ? new Date().toISOString() : null,
                }
              : p,
          ),
        );
        toast.success(currentStatus ? "Post unpublished" : "Post published");
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error("Failed to toggle publish status:", error);
      toast.error("Failed to update post");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your blog content
          </p>
        </div>
        <Link href="/dashboard/posts/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No blog posts yet</p>
            <Link href="/dashboard/posts/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Write your first post
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {post.title}
                      </h3>
                      <Badge variant={post.published ? "default" : "secondary"}>
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatDate(post.publishedAt)}</span>
                      <span>{post.readingTime} min read</span>
                      {post.published && post._count && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post._count.views.toLocaleString()} views
                        </span>
                      )}
                      {post.tags?.length > 0 && (
                        <span className="flex gap-1">
                          {post.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag.id}
                              className="bg-secondary px-1.5 py-0.5 rounded"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleTogglePublish(post.id, post.published)
                      }
                      title={post.published ? "Unpublish" : "Publish"}
                    >
                      {post.published ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Link href={`/dashboard/posts/${post.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(post.id, post.title)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
