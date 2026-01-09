import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, getFileStream } from "@/lib/google-drive";
import { prisma } from "@ecosystem/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get file metadata
    const file = await prisma.eDSFile.findUnique({
      where: { id },
      include: { node: true },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.deletedAt) {
      return NextResponse.json(
        { error: "File has been deleted" },
        { status: 410 },
      );
    }

    // Get drive client
    const drive = await getDriveClient(file.nodeId);

    // Get file stream
    const stream = await getFileStream(drive, file.googleFileId);

    // Log download activity
    await prisma.eDSActivityLog.create({
      data: {
        action: "DOWNLOAD",
        targetType: "FILE",
        targetId: file.id,
        metadata: { name: file.name },
      },
    });

    // Return stream response
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
        "Content-Length": file.size.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Soft delete
    const file = await prisma.eDSFile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Update node used space
    await prisma.storageNode.update({
      where: { id: file.nodeId },
      data: {
        usedSpace: {
          decrement: file.size,
        },
      },
    });

    // Log activity
    await prisma.eDSActivityLog.create({
      data: {
        action: "DELETE",
        targetType: "FILE",
        targetId: file.id,
        metadata: { name: file.name },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
