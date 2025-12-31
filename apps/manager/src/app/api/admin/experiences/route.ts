import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";

// GET /api/admin/experiences - List all experiences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const experiences = await prisma.experience.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json(experiences);
  } catch (error) {
    console.error("Failed to fetch experiences:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiences" },
      { status: 500 },
    );
  }
}

// POST /api/admin/experiences - Create new experience
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!company || !position || !startDate) {
      return NextResponse.json(
        { error: "Company, Position and Start Date are required" },
        { status: 400 },
      );
    }

    const experience = await prisma.experience.create({
      data: {
        company,
        position,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        current: current || false,
        location,
        companyUrl,
        companyLogo,
        order: order || 0,
      },
    });

    return NextResponse.json(experience, { status: 201 });
  } catch (error) {
    console.error("Failed to create experience:", error);
    return NextResponse.json(
      { error: "Failed to create experience" },
      { status: 500 },
    );
  }
}
