import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/experiences/[id] - Get single experience
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const experience = await prisma.experience.findUnique({
      where: { id },
    });

    if (!experience) {
      return NextResponse.json(
        { error: "Experience not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(experience);
  } catch (error) {
    console.error("Failed to fetch experience:", error);
    return NextResponse.json(
      { error: "Failed to fetch experience" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/experiences/[id] - Update experience
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      company,
      position,
      description,
      startDate,
      endDate,
      current,
      location,
      companyUrl,
      companyLogo,
      order,
    } = body;

    const experience = await prisma.experience.update({
      where: { id },
      data: {
        company,
        position,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        current,
        location,
        companyUrl,
        companyLogo,
        order,
      },
    });

    return NextResponse.json(experience);
  } catch (error) {
    console.error("Failed to update experience:", error);
    return NextResponse.json(
      { error: "Failed to update experience" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/experiences/[id] - Delete experience
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.experience.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Experience deleted" });
  } catch (error) {
    console.error("Failed to delete experience:", error);
    return NextResponse.json(
      { error: "Failed to delete experience" },
      { status: 500 },
    );
  }
}
