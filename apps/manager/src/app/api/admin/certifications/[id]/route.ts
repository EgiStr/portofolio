import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";

// GET /api/admin/certifications/[id] - Get single certification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const certification = await prisma.certification.findUnique({
      where: { id },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!certification) {
      return NextResponse.json(
        { error: "Certification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(certification);
  } catch (error) {
    console.error("Failed to fetch certification:", error);
    return NextResponse.json(
      { error: "Failed to fetch certification" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/certifications/[id] - Update certification
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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

    // Delete existing skill associations and create new ones
    await prisma.certificationSkill.deleteMany({
      where: { certificationId: id },
    });

    const certification = await prisma.certification.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(organization && { organization }),
        ...(issueDate && { issueDate: new Date(issueDate) }),
        ...(credentialId !== undefined && { credentialId }),
        ...(verificationUrl !== undefined && { verificationUrl }),
        ...(organizationLogo !== undefined && { organizationLogo }),
        ...(certificateFile !== undefined && { certificateFile }),
        ...(category && { category }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(skillIds && {
          skills: {
            create: skillIds.map((skillId: string) => ({
              skillId,
            })),
          },
        }),
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    return NextResponse.json(certification);
  } catch (error) {
    console.error("Failed to update certification:", error);
    return NextResponse.json(
      { error: "Failed to update certification" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/certifications/[id] - Delete certification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.certification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete certification:", error);
    return NextResponse.json(
      { error: "Failed to delete certification" },
      { status: 500 },
    );
  }
}
