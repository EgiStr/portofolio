import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";
import { createHash, randomBytes } from "crypto";

const API_KEY_PREFIX = "exstr_live_";

// Utility functions (duplicated here for manager app - could be shared package)
function generateApiKey(): {
  fullKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const randomPart = randomBytes(16).toString("hex");
  const fullKey = `${API_KEY_PREFIX}${randomPart}`;
  const keyHash = createHash("sha256").update(fullKey).digest("hex");
  const keyPrefix = fullKey.substring(0, 12);
  return { fullKey, keyHash, keyPrefix };
}

// GET /api/admin/api-keys - List all API keys
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude keyHash for security
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 },
    );
  }
}

// POST /api/admin/api-keys - Generate new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate the API key
    const { fullKey, keyHash, keyPrefix } = generateApiKey();

    // Store in database
    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        keyPrefix,
        keyHash,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Return the full key ONLY on creation
    // This is the only time the user will see the full key
    return NextResponse.json(
      {
        ...apiKey,
        key: fullKey, // Full key - only shown once!
        message: "Save this key securely. It will not be shown again.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 },
    );
  }
}
