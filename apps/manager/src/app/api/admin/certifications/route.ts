import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";

// GET /api/admin/certifications - List all certifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const certifications = await prisma.certification.findMany({
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(certifications);
  } catch (error) {
    console.error("Failed to fetch certifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch certifications" },
      { status: 500 },
    );
  }
}

// POST /api/admin/certifications - Create new certification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      organization,
      issueDate,
      credentialId,
      verificationUrl,
      organizationLogo,
      certificateFile,
      category,
      displayOrder,
      skillIds,
    } = body;

    if (!name || !organization || !issueDate) {
      return NextResponse.json(
        { error: "Name, Organization and Issue Date are required" },
        { status: 400 },
      );
    }

    // Create certification with skill associations
    const certification = await prisma.certification.create({
      data: {
        name,
        organization,
        issueDate: new Date(issueDate),
        credentialId,
        verificationUrl,
        organizationLogo,
        certificateFile,
        category: category || "OTHER",
        displayOrder: displayOrder || 0,
        skills: {
          create: (skillIds || []).map((skillId: string) => ({
            skillId,
          })),
        },
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    return NextResponse.json(certification, { status: 201 });
  } catch (error) {
    console.error("Failed to create certification:", error);
    return NextResponse.json(
      { error: "Failed to create certification" },
      { status: 500 },
    );
  }
}
