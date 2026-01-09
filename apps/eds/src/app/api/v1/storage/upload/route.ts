import { NextRequest } from "next/server";
import { prisma } from "@ecosystem/database";
import { withApiKey } from "@/lib/middleware/with-api-key";
import { apiSuccess, apiError } from "@/lib/api-response";
import {
  selectNodeForUploadWithFallback,
  createReservation,
  releaseReservation,
} from "@/lib/quota-manager";
import { getValidAccessToken } from "@/lib/google-drive";

const MAX_NODE_ATTEMPTS = 3;
const UPLOAD_URL_EXPIRY_SECONDS = 3600; // 1 hour

interface UploadRequestBody {
  filename: string;
  mimeType: string;
  size: number;
  folderPath?: string; // Virtual path like "/backups/server-a"
}

/**
 * Find or create folder hierarchy from path
 * Returns the folder ID of the deepest folder
 */
async function ensureFolderPath(folderPath: string): Promise<string | null> {
  if (!folderPath || folderPath === "/") {
    return null; // Root folder
  }

  // Normalize path
  const normalizedPath = folderPath.startsWith("/")
    ? folderPath
    : `/${folderPath}`;
  const parts = normalizedPath.split("/").filter(Boolean);

  let parentId: string | null = null;
  let currentPath = "";

  for (const part of parts) {
    currentPath += `/${part}`;

    // Check if folder exists
    let folder: Awaited<ReturnType<typeof prisma.eDSFolder.findFirst>> =
      await prisma.eDSFolder.findFirst({
        where: {
          name: part,
          parentId: parentId,
        },
      });

    // Create if not exists
    if (!folder) {
      folder = await prisma.eDSFolder.create({
        data: {
          name: part,
          path: currentPath,
          parentId: parentId,
        },
      });

      // Log folder creation
      await prisma.eDSActivityLog.create({
        data: {
          action: "CREATE_FOLDER",
          targetType: "FOLDER",
          targetId: folder.id,
          metadata: { name: folder.name, path: folder.path, source: "API" },
        },
      });
    }

    parentId = folder.id;
  }

  return parentId;
}

/**
 * POST /api/v1/storage/upload
 * External API endpoint for requesting upload URL (2-step upload flow)
 * Protected by API key authentication
 */
async function handler(request: NextRequest) {
  try {
    const body: UploadRequestBody = await request.json();
    const { filename, mimeType, size, folderPath } = body;

    // Validate required fields
    if (!filename || typeof filename !== "string") {
      return apiError("Missing or invalid 'filename'", 400);
    }
    if (!mimeType || typeof mimeType !== "string") {
      return apiError("Missing or invalid 'mimeType'", 400);
    }
    if (!size || typeof size !== "number" || size <= 0) {
      return apiError(
        "Missing or invalid 'size' (must be positive number)",
        400,
      );
    }

    const fileSize = BigInt(size);
    const attemptedNodes: string[] = [];
    let lastError = "No available nodes";

    // Ensure folder path exists (if provided)
    let folderId: string | null = null;
    if (folderPath) {
      try {
        folderId = await ensureFolderPath(folderPath);
      } catch (err) {
        console.error("Failed to create folder path:", err);
        return apiError("Failed to create folder path", 500);
      }
    }

    // Try multiple nodes with fallback
    for (let attempt = 0; attempt < MAX_NODE_ATTEMPTS; attempt++) {
      // Select best available node (excluding failed ones)
      const node = await selectNodeForUploadWithFallback(
        fileSize,
        attemptedNodes,
      );

      if (!node) {
        break;
      }

      attemptedNodes.push(node.id);

      // Try to get valid access token
      const accessToken = await getValidAccessToken(node.id);

      if (!accessToken) {
        console.warn(`Node ${node.id} token invalid, trying next node...`);
        lastError = `Node ${node.email} token refresh failed`;
        continue;
      }

      // Create reservation
      const reservationId = await createReservation(node.id, fileSize);

      try {
        // Create resumable upload session with Google Drive API
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
              name: filename,
              mimeType: mimeType,
            }),
          },
        );

        // Handle authentication errors
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

        // Get the resumable upload URL
        const uploadUrl = initResponse.headers.get("Location");

        if (!uploadUrl) {
          await releaseReservation(reservationId);
          lastError = "No upload URL returned from Google";
          continue;
        }

        // Log the upload initiation
        await prisma.eDSActivityLog.create({
          data: {
            action: "UPLOAD_INIT",
            targetType: "FILE",
            metadata: {
              filename,
              mimeType,
              size,
              folderPath,
              folderId,
              nodeId: node.id,
              reservationId,
              source: "API",
            },
          },
        });

        // Success! Return upload details
        return apiSuccess({
          uploadUrl,
          expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
          method: "PUT",
          // Include metadata for client to finalize
          _meta: {
            nodeId: node.id,
            reservationId,
            folderId,
          },
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
      return apiError("Insufficient storage. No available nodes.", 507);
    }

    return apiError(
      `Upload failed after ${attemptedNodes.length} attempts: ${lastError}`,
      500,
    );
  } catch (error) {
    console.error("External upload init error:", error);
    return apiError("Failed to initialize upload", 500);
  }
}

export const POST = withApiKey(handler);
