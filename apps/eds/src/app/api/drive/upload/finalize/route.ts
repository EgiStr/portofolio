import { NextRequest, NextResponse } from "next/server";
import { finalizeUpload } from "@/lib/quota-manager";

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

    const file = await finalizeUpload({
      nodeId,
      reservationId,
      googleFileId,
      name: fileMeta.name,
      mimeType: fileMeta.mimeType,
      size: BigInt(fileMeta.size),
      folderId: fileMeta.folderId,
    });

    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    console.error("Upload finalize error:", error);
    return NextResponse.json(
      { error: "Failed to finalize upload" },
      { status: 500 },
    );
  }
}
