import { NextRequest, NextResponse } from "next/server";
import {
  getAuthUrl,
  exchangeCodeForTokens,
  getOAuth2Client,
} from "@/lib/google-drive";
import { encryptToken } from "@/lib/encryption";
import { prisma } from "@ecosystem/database";
import { google } from "googleapis";

// GET: Redirect to Google OAuth
export async function GET() {
  const authUrl = getAuthUrl();
  return NextResponse.redirect(authUrl);
}

// This is handled by the callback route
