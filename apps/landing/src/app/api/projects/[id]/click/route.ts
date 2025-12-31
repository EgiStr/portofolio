import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to record click:", error);
    return NextResponse.json(
      { error: "Failed to record click", details: (error as Error).message },
      { status: 500, headers: corsHeaders },
    );
  }
}
