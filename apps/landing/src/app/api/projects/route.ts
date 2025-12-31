import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

// GET /api/projects - Get all published projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");

    const projects = await prisma.project.findMany({
      where: {
        status: "PUBLISHED",
        ...(featured === "true" && { featured: true }),
      },
      include: {
        techStack: true,
      },
      orderBy: [
        { featured: "desc" },
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}
