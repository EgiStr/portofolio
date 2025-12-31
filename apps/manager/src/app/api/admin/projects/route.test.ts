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

describe("Projects API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/projects", () => {
    it("should return 401 if not authenticated", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/admin/projects");
      const res = await GET(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return list of projects when authenticated", async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: "admin-id" } });

      const mockProjects = [
        {
          id: "1",
          title: "Project 1",
          featured: false,
          displayOrder: 0,
          createdAt: new Date(),
        },
        {
          id: "2",
          title: "Project 2",
          featured: true,
          displayOrder: 1,
          createdAt: new Date(),
        },
      ];

      prismaMock.project.findMany.mockResolvedValue(mockProjects as any);
      prismaMock.project.count.mockResolvedValue(2);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/projects?page=1&limit=10",
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data).toHaveLength(2);
      expect(json.pagination.total).toBe(2);
      expect(prismaMock.project.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/admin/projects", () => {
    it("should create a new project", async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: "admin-id" } });

      const newProjectData = {
        title: "New Project",
        slug: "new-project",
        description: "Description",
        techStack: ["React", "Node"],
      };

      const createdProject = {
        id: "123",
        ...newProjectData,
        techStack: [
          { id: "t1", name: "React" },
          { id: "t2", name: "Node" },
        ],
        createdAt: new Date(),
      };

      prismaMock.project.create.mockResolvedValue(createdProject as any);

      const req = new NextRequest("http://localhost:3000/api/admin/projects", {
        method: "POST",
        body: JSON.stringify(newProjectData),
      });

      const res = await POST(req);

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe("123");
      expect(prismaMock.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "New Project",
          slug: "new-project",
          authorId: "admin-id",
        }),
        include: { techStack: true },
      });
    });

    it("should return 400 if required fields are missing", async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: "admin-id" } });

      const req = new NextRequest("http://localhost:3000/api/admin/projects", {
        method: "POST",
        body: JSON.stringify({ title: "Missing Slug" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
