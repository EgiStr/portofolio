import { NextRequest, NextResponse } from "next/server";
import { selectNodeForUpload, createReservation } from "@/lib/quota-manager";
import { prisma } from "@ecosystem/database";
import { decryptToken } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, size, mimeType, folderId } = body;

    if (!name || !size || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: name, size, mimeType" },
        { status: 400 },
      );
    }

    const fileSize = BigInt(size);

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

    // Decrypt access token
    const accessToken = decryptToken(nodeData.accessTokenEncrypted);

    // Create resumable upload session directly with Google API
    const initResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": mimeType,
          "X-Upload-Content-Length": size.toString(),
        },
        body: JSON.stringify({
          name: name,
          mimeType: mimeType,
        }),
      },
    );

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error("Google API error:", errorText);
      return NextResponse.json(
        { error: "Failed to create upload session" },
        { status: 500 },
      );
    }

    // Get the resumable upload URL from Location header
    const uploadUrl = initResponse.headers.get("Location");

    if (!uploadUrl) {
      return NextResponse.json(
        { error: "No upload URL returned from Google" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      uploadUrl,
      nodeId: node.id,
      reservationId,
      accessToken, // Client needs this to PUT to uploadUrl
    });
  } catch (error) {
    console.error("Upload init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize upload" },
      { status: 500 },
    );
  }
}
