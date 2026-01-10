import { NextRequest, NextResponse } from "next/server";
import { finalizeUpload } from "@/lib/quota-manager";
import { prisma } from "@ecosystem/database";
import { generateUniqueFileSlug } from "@/lib/slug-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { googleFileId, nodeId, reservationId, fileMeta } = body;

    if (!googleFileId || !nodeId || !reservationId || !fileMeta) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { name, mimeType, size, folderId } = fileMeta;

    // Get existing files in the folder to check for duplicates
    const existingFiles = await prisma.eDSFile.findMany({
      where: {
        folderId: folderId || null,
        deletedAt: null,
      },
      select: { slug: true },
    });

    // Generate unique slug for the file
    const fileSlug = generateUniqueFileSlug(name, existingFiles);

    const file = await finalizeUpload({
      nodeId,
      reservationId,
      googleFileId,
      name,
      slug: fileSlug,
      mimeType,
      size: BigInt(size),
      folderId,
    });

    return NextResponse.json(
      {
        file: {
          ...file,
          size: file.size.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Upload finalize error:", error);
    return NextResponse.json(
      { error: "Failed to finalize upload" },
      { status: 500 },
    );
  }
}
