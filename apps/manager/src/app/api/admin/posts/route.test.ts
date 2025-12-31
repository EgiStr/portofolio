import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";

// Mock Prisma
vi.mock("@ecosystem/database", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

// Mock NextAuth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock authOptions
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { GET, POST } from "./route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@ecosystem/database";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("Blog Posts API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/posts", () => {
    it("should return 401 if not authenticated", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/admin/posts");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("should return paginated posts", async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: "admin" } });

      const mockPosts = [
        { id: "1", title: "Post 1", slug: "post-1" },
        { id: "2", title: "Post 2", slug: "post-2" },
      ];

      prismaMock.blogPost.findMany.mockResolvedValue(mockPosts as any);
      prismaMock.blogPost.count.mockResolvedValue(2);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/posts?page=1&limit=10",
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveLength(2);
      expect(json.pagination.total).toBe(2);
    });
  });

  describe("POST /api/admin/posts", () => {
    it("should create new post and upsert tags", async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: "admin" } });

      const newPostData = {
        title: "New Blog Post",
        slug: "new-blog-post",
        content: "Content here with enough words.",
        tags: ["React", "NextJS"],
      };

      // Mock Upsert loop
      prismaMock.blogTag.upsert.mockResolvedValue({
        id: "tag-id",
        name: "React",
        slug: "react",
      } as any);

      // Mock Create
      prismaMock.blogPost.create.mockResolvedValue({
        id: "123",
        ...newPostData,
        authorId: "admin",
        createdAt: new Date(),
      } as any);

      const req = new NextRequest("http://localhost:3000/api/admin/posts", {
        method: "POST",
        body: JSON.stringify(newPostData),
      });

      const res = await POST(req);

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe("123");

      // Verify tags upsert called
      expect(prismaMock.blogTag.upsert).toHaveBeenCalledTimes(2);
      expect(prismaMock.blogPost.create).toHaveBeenCalled();
    });

    it("should return 409 if unique constraint (slug) failed", async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: "admin" } });

      const newPostData = {
        title: "Duplicate Slug",
        slug: "duplicate-slug",
        content: "Content",
      };

      const error = new Error("Unique constraint");
      (error as any).code = "P2002";
      prismaMock.blogPost.create.mockRejectedValue(error);

      const req = new NextRequest("http://localhost:3000/api/admin/posts", {
        method: "POST",
        body: JSON.stringify(newPostData),
      });

      const res = await POST(req);
      expect(res.status).toBe(409);
    });
  });
});
