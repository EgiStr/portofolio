"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@ecosystem/ui";
import { ArrowLeft, Loader2, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/upload/image-upload";
import { useMarkdownImageUpload } from "@/hooks/use-markdown-upload";
import { MarkdownPreview } from "@/components/markdown/markdown-preview";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { isUploading, handlePaste, handleDrop } = useMarkdownImageUpload({
    bucket: "blog",
  });
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    published: false,
    tags: "",
  });

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/admin/posts/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch post");
        }
        const data = await response.json();

        setFormData({
          title: data.title || "",
          slug: data.slug || "",
          excerpt: data.excerpt || "",
          content: data.content || "",
          coverImage: data.coverImage || "",
          published: data.published || false,
          tags: data.tags ? data.tags.map((t: any) => t.name).join(", ") : "",
        });
      } catch (error) {
        console.error("Error fetching post:", error);
        toast.error("Failed to load post");
        router.push("/dashboard/posts");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPost();
  }, [resolvedParams.id, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent, publish?: boolean) => {
    e.preventDefault();
    setIsSaving(true);

    // If publish argument is provided, use it. Otherwise keep current status.
    const newStatus = publish !== undefined ? publish : formData.published;

    try {
      const payload = {
        ...formData,
        published: newStatus,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const response = await fetch(`/api/admin/posts/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update post");
      }

      toast.success(
        newStatus
          ? "Post published successfully!"
          : "Post updated successfully!",
      );
      router.push("/dashboard/posts");
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update post",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate reading time based on content
  const wordCount = formData.content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link
          href="/dashboard/posts"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Posts
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Edit Blog Post
            </h1>
            <p className="text-muted-foreground mt-1">
              Update your article content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{wordCount} words</Badge>
            <Badge variant="secondary">{readingTime} min read</Badge>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="How to Build a Personal Ecosystem"
                className="text-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="how-to-build-personal-ecosystem"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateSlug}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="Next.js, React, Tutorial"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt *</Label>
              <Textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="A brief summary that appears in post listings..."
                rows={2}
                required
              />
            </div>

            <ImageUpload
              value={formData.coverImage}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, coverImage: url }))
              }
              bucket="blog"
              label="Cover Image"
              aspectRatio="video"
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Content (Markdown/MDX)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Button
                  type="button"
                  variant={activeTab === "write" ? "default" : "ghost"}
                  onClick={() => setActiveTab("write")}
                  size="sm"
                >
                  Write
                </Button>
                <Button
                  type="button"
                  variant={activeTab === "preview" ? "default" : "ghost"}
                  onClick={() => setActiveTab("preview")}
                  size="sm"
                >
                  Preview
                </Button>
              </div>

              {activeTab === "write" ? (
                <div className="space-y-2 relative">
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    onPaste={handlePaste}
                    onDrop={handleDrop}
                    placeholder="# Introduction..."
                    rows={20}
                    className={`font-mono text-sm ${isUploading ? "opacity-50" : ""}`}
                  />
                  {isUploading && (
                    <div className="absolute top-2 right-2 flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border shadow-sm">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      <span className="text-xs font-medium">
                        Uploading image...
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Supports Markdown and MDX syntax.{" "}
                    <strong>
                      Paste or Drop images directly into the editor.
                    </strong>
                  </p>
                </div>
              ) : (
                <MarkdownPreview content={formData.content} />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="submit"
            variant="outline"
            disabled={isSaving}
            onClick={(e) => handleSubmit(e, false)}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Save as Draft
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Publish Now
              </>
            )}
          </Button>
          <Link href="/dashboard/posts">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
