import { google, Auth } from "googleapis";
import { decryptToken, encryptToken } from "./encryption";
import { prisma } from "@ecosystem/database";

export type DriveClient = ReturnType<typeof google.drive>;
export type OAuth2Client = InstanceType<typeof Auth.OAuth2Client>;

// Custom error for node token failures
export class NodeTokenError extends Error {
  constructor(
    public nodeId: string,
    public originalError: unknown,
  ) {
    super(`Token refresh failed for node ${nodeId}`);
    this.name = "NodeTokenError";
  }
}

// OAuth2 client configuration
export function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

// Get authorization URL for adding new nodes
export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Refresh token for a specific node (returns new access token or null on failure)
export async function refreshNodeToken(nodeId: string): Promise<string | null> {
  const node = await prisma.storageNode.findUnique({
    where: { id: nodeId },
  });

  if (!node) return null;

  const oauth2Client = getOAuth2Client();
  const refreshToken = decryptToken(node.refreshTokenEncrypted);

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) return null;

    // Update tokens in database
    await prisma.storageNode.update({
      where: { id: nodeId },
      data: {
        accessTokenEncrypted: encryptToken(credentials.access_token),
        tokenExpiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : null,
      },
    });

    return credentials.access_token;
  } catch (error) {
    console.error(`Token refresh failed for node ${nodeId}:`, error);
    return null;
  }
}

// Get valid access token for a node (refreshes if needed)
export async function getValidAccessToken(
  nodeId: string,
): Promise<string | null> {
  const node = await prisma.storageNode.findUnique({
    where: { id: nodeId },
  });

  if (!node || !node.isActive) return null;

  try {
    const accessToken = decryptToken(node.accessTokenEncrypted);

    // Check if token is expired or about to expire (5 min buffer)
    const bufferMs = 5 * 60 * 1000;
    const needsRefresh =
      node.tokenExpiresAt &&
      new Date(node.tokenExpiresAt.getTime() - bufferMs) <= new Date();

    if (needsRefresh) {
      return await refreshNodeToken(nodeId);
    }

    return accessToken;
  } catch (error) {
    console.error(
      `Failed to decrypt token for node ${nodeId}. Check ENCRYPTION_KEY match.`,
      error,
    );
    return null;
  }
}

// Get authenticated drive client for a specific node
export async function getDriveClient(nodeId: string): Promise<DriveClient> {
  const node = await prisma.storageNode.findUnique({
    where: { id: nodeId },
  });

  if (!node) {
    throw new Error(`Storage node ${nodeId} not found`);
  }

  const oauth2Client = getOAuth2Client();

  // Decrypt tokens
  const accessToken = decryptToken(node.accessTokenEncrypted);
  const refreshToken = decryptToken(node.refreshTokenEncrypted);

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Check if token needs refresh (with error handling)
  if (node.tokenExpiresAt && new Date() >= node.tokenExpiresAt) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update tokens in database
      await prisma.storageNode.update({
        where: { id: nodeId },
        data: {
          accessTokenEncrypted: encryptToken(credentials.access_token || ""),
          tokenExpiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : null,
        },
      });
    } catch (error) {
      throw new NodeTokenError(nodeId, error);
    }
  }

  return google.drive({ version: "v3", auth: oauth2Client });
}

// Get storage quota for a node
export async function getStorageQuota(drive: DriveClient) {
  const response = await drive.about.get({
    fields: "storageQuota",
  });

  const quota = response.data.storageQuota;
  return {
    total: BigInt(quota?.limit || "16106127360"), // 15GB default
    used: BigInt(quota?.usage || "0"),
  };
}

// Create a resumable upload session
export async function createResumableUpload(
  drive: DriveClient,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const response = await drive.files.create(
    {
      requestBody: {
        name: fileName,
        mimeType: mimeType,
      },
    },
    {
      // Request resumable upload
      params: {
        uploadType: "resumable",
      },
    },
  );

  // The upload URL is in the response headers
  // For Google Drive API v3, we need to handle this differently
  // Return the location header for resumable upload
  const headers = response.headers as Record<string, string>;
  return headers["location"] || "";
}

// Get file stream for download
export async function getFileStream(drive: DriveClient, googleFileId: string) {
  const response = await drive.files.get(
    {
      fileId: googleFileId,
      alt: "media",
    },
    {
      responseType: "stream",
    },
  );

  return response.data;
}

// Delete a file from Google Drive
export async function deleteGoogleFile(
  drive: DriveClient,
  googleFileId: string,
) {
  await drive.files.delete({
    fileId: googleFileId,
  });
}
