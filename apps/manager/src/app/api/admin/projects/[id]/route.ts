import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/projects/[id] - Get single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { techStack: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      slug,
      description,
      longDescription,
      imageUrl,
      liveUrl,
      githubUrl,
      featured,
      status,
      displayOrder,
      techStack,
    } = body;

    // Use transaction to update tech stack safely
    const project = await prisma.$transaction(async (tx) => {
      // 1. Delete existing tech stack
      await tx.projectTech.deleteMany({ where: { projectId: id } });

      // 2. Update project and recreate tech stack
      return tx.project.update({
        where: { id },
        data: {
          title,
          slug,
          description,
          longDescription,
          imageUrl,
          liveUrl,
          githubUrl,
          featured,
          status,
          displayOrder,
          techStack: {
            create: techStack?.map((tech: string) => ({ name: tech })) || [],
          },
        },
        include: { techStack: true },
      });
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/projects/[id] - Delete project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
