import { NextRequest, NextResponse } from "next/server";
import {
  selectNodeForUpload,
  createReservation,
  finalizeUpload,
  releaseReservation,
} from "@/lib/quota-manager";
import { prisma } from "@ecosystem/database";
import { decryptToken } from "@/lib/encryption";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Increase body size limit for file uploads
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileSize = BigInt(file.size);
    const fileName = file.name;
    const mimeType = file.type || "application/octet-stream";

    // Select best node for upload
    const node = await selectNodeForUpload(fileSize);

    if (!node) {
      return NextResponse.json(
        { error: "Insufficient storage. No available nodes." },
        { status: 507 },
      );
    }

    // Get actual node data with tokens
    const nodeData = await prisma.storageNode.findUnique({
      where: { id: node.id },
    });

    if (!nodeData) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    // Create reservation
    const reservationId = await createReservation(node.id, fileSize);

    try {
      // Decrypt access token
      const accessToken = decryptToken(nodeData.accessTokenEncrypted);

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload directly to Google Drive using simple upload
      const uploadResponse = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=foo_bar_baz`,
          },
          body: createMultipartBody(fileName, mimeType, buffer) as any,
        },
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Google API error:", errorText);
        throw new Error("Failed to upload to Google Drive");
      }

      const uploadResult = await uploadResponse.json();
      const googleFileId = uploadResult.id;

      // Finalize upload
      const edsFile = await finalizeUpload({
        nodeId: node.id,
        reservationId,
        googleFileId,
        name: fileName,
        mimeType,
        size: fileSize,
        folderId: folderId || undefined,
      });

      return NextResponse.json({
        success: true,
        file: {
          id: edsFile.id,
          name: edsFile.name,
          size: edsFile.size.toString(),
        },
      });
    } catch (error) {
      // Release reservation on error
      await releaseReservation(reservationId);
      throw error;
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload" },
      { status: 500 },
    );
  }
}

function createMultipartBody(
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
): Buffer {
  const boundary = "foo_bar_baz";
  const metadata = JSON.stringify({
    name: fileName,
    mimeType: mimeType,
  });

  const header =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`;

  const footer = `\r\n--${boundary}--`;

  return Buffer.concat([
    Buffer.from(header, "utf-8"),
    fileBuffer,
    Buffer.from(footer, "utf-8"),
  ]);
}
