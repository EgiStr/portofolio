import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

export const dynamic = "force-dynamic";

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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

    return NextResponse.json(projects, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects", details: (error as Error).message },
      { status: 500, headers: corsHeaders },
    );
  }
}
