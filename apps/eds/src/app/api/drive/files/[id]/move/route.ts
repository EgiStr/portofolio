import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

// PATCH: Move file to different folder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { folderId } = body;

    const file = await prisma.eDSFile.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Update file folder
    const updated = await prisma.eDSFile.update({
      where: { id },
      data: { folderId: folderId || null },
    });

    // Log activity
    await prisma.eDSActivityLog.create({
      data: {
        action: "MOVE_FILE",
        targetType: "FILE",
        targetId: file.id,
        metadata: {
          name: file.name,
          fromFolder: file.folderId,
          toFolder: folderId,
        },
      },
    });

    return NextResponse.json({
      file: {
        ...updated,
        size: updated.size.toString(), // Convert BigInt to string
      },
    });
  } catch (error) {
    console.error("Move file error:", error);
    return NextResponse.json({ error: "Failed to move file" }, { status: 500 });
  }
}
