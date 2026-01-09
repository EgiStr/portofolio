import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getOAuth2Client,
  getStorageQuota,
} from "@/lib/google-drive";
import { encryptToken } from "@/lib/encryption";
import { prisma } from "@ecosystem/database";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/nodes?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/nodes?error=no_code", request.url));
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/nodes?error=no_tokens", request.url),
      );
    }

    // Get user info to get email
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (!email) {
      return NextResponse.redirect(
        new URL("/nodes?error=no_email", request.url),
      );
    }

    // Check if node already exists
    const existingNode = await prisma.storageNode.findUnique({
      where: { email },
    });

    if (existingNode) {
      // Update existing node
      await prisma.storageNode.update({
        where: { email },
        data: {
          accessTokenEncrypted: encryptToken(tokens.access_token),
          refreshTokenEncrypted: encryptToken(tokens.refresh_token),
          tokenExpiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : null,
          isActive: true,
        },
      });
    } else {
      // Get storage quota
      const drive = google.drive({ version: "v3", auth: oauth2Client });
      const quota = await getStorageQuota(drive);

      // Create new node
      await prisma.storageNode.create({
        data: {
          email,
          accessTokenEncrypted: encryptToken(tokens.access_token),
          refreshTokenEncrypted: encryptToken(tokens.refresh_token),
          totalSpace: quota.total,
          usedSpace: quota.used,
          tokenExpiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : null,
        },
      });

      // Log activity
      await prisma.eDSActivityLog.create({
        data: {
          action: "NODE_ADDED",
          targetType: "NODE",
          metadata: { email },
        },
      });
    }

    return NextResponse.redirect(new URL("/nodes?success=true", request.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/nodes?error=auth_failed", request.url),
    );
  }
}
