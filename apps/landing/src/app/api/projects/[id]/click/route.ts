import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/projects/[id]/click - Increment project clicks
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.project.update({
      where: { id },
      data: {
        clicks: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record click:", error);
    return NextResponse.json(
      { error: "Failed to record click" },
      { status: 500 },
    );
  }
}
