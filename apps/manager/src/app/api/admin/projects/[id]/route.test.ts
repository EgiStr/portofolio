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

import { GET, PUT, DELETE } from "./route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@ecosystem/database";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("Projects Single Item API", () => {
  const params = Promise.resolve({ id: "123" });

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock transaction to execute callback immediately
    (prismaMock.$transaction as any).mockImplementation((callback: any) => {
      return callback(prismaMock);
    });
  });

  describe("GET /api/admin/projects/[id]", () => {
    it("should return 401 if not authenticated", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const req = new NextRequest(
        "http://localhost:3000/api/admin/projects/123",
      );
      const res = await GET(req, { params });

      expect(res.status).toBe(401);
    });

    it("should return project if found", async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: "admin" } });
      const mockProject = { id: "123", title: "Test Project" };
      prismaMock.project.findUnique.mockResolvedValue(mockProject as any);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/projects/123",
      );
      const res = await GET(req, { params });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual(mockProject);
    });

    it("should return 404 if project not found", async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: "admin" } });
      prismaMock.project.findUnique.mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/projects/123",
      );
      const res = await GET(req, { params });

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/admin/projects/[id]", () => {
    it("should update project and return simplified project object", async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: "admin" } });

      const updateData = {
        title: "Updated Title",
        techStack: ["React"],
      };

      const updatedProject = { id: "123", title: "Updated Title" };
      prismaMock.project.update.mockResolvedValue(updatedProject as any);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/projects/123",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        },
      );

      const res = await PUT(req, { params });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual(updatedProject);

      // Check transaction usage
      expect(prismaMock.projectTech.deleteMany).toHaveBeenCalledWith({
        where: { projectId: "123" },
      });
      expect(prismaMock.project.update).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/admin/projects/[id]", () => {
    it("should delete project", async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: "admin" } });

      const req = new NextRequest(
        "http://localhost:3000/api/admin/projects/123",
        {
          method: "DELETE",
        },
      );

      const res = await DELETE(req, { params });

      expect(res.status).toBe(200);
      expect(prismaMock.project.delete).toHaveBeenCalledWith({
        where: { id: "123" },
      });
    });
  });
});
