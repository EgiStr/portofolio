import { NextRequest, NextResponse } from "next/server";
import {
  selectNodeForUploadWithFallback,
  createReservation,
  releaseReservation,
} from "@/lib/quota-manager";
import { getValidAccessToken } from "@/lib/google-drive";

const MAX_NODE_ATTEMPTS = 3;

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
    const attemptedNodes: string[] = [];
    let lastError: string = "No available nodes";

    // Try multiple nodes with fallback
    for (let attempt = 0; attempt < MAX_NODE_ATTEMPTS; attempt++) {
      // Select best available node (excluding failed ones)
      const node = await selectNodeForUploadWithFallback(
        fileSize,
        attemptedNodes,
      );

      if (!node) {
        // No more nodes available
        break;
      }

      attemptedNodes.push(node.id);

      // Try to get valid access token (handles refresh)
      const accessToken = await getValidAccessToken(node.id);

      if (!accessToken) {
        console.warn(`Node ${node.id} token invalid, trying next node...`);
        lastError = `Node ${node.email} token refresh failed`;
        continue;
      }

      // Create reservation (will be released on failure)
      const reservationId = await createReservation(node.id, fileSize);

      try {
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
              ...(request.headers.get("origin")
                ? { Origin: request.headers.get("origin")! }
                : {}),
            },
            body: JSON.stringify({
              name: name,
              mimeType: mimeType,
            }),
          },
        );

        // Handle authentication errors - try next node
        if (initResponse.status === 401 || initResponse.status === 403) {
          console.warn(
            `Node ${node.id} auth failed (${initResponse.status}), trying next...`,
          );
          await releaseReservation(reservationId);
          lastError = `Node ${node.email} authentication failed`;
          continue;
        }

        if (!initResponse.ok) {
          const errorText = await initResponse.text();
          console.error("Google API error:", errorText);
          await releaseReservation(reservationId);
          lastError = "Google API error";
          continue;
        }

        // Get the resumable upload URL from Location header
        const uploadUrl = initResponse.headers.get("Location");

        if (!uploadUrl) {
          await releaseReservation(reservationId);
          lastError = "No upload URL returned from Google";
          continue;
        }

        // Success! Return upload details
        return NextResponse.json({
          uploadUrl,
          nodeId: node.id,
          reservationId,
          accessToken,
        });
      } catch (error) {
        console.error(`Upload init error for node ${node.id}:`, error);
        await releaseReservation(reservationId);
        lastError = "Failed to create upload session";
        continue;
      }
    }

    // All attempts failed
    if (attemptedNodes.length === 0) {
      return NextResponse.json(
        { error: "Insufficient storage. No available nodes." },
        { status: 507 },
      );
    }

    return NextResponse.json(
      {
        error: `Upload failed after ${attemptedNodes.length} attempts: ${lastError}`,
      },
      { status: 500 },
    );
  } catch (error) {
    console.error("Upload init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize upload" },
      { status: 500 },
    );
  }
}
