import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";

// GET /api/admin/api-keys/[id] - Get single API key
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json(apiKey);
  } catch (error) {
    console.error("Failed to fetch API key:", error);
    return NextResponse.json(
      { error: "Failed to fetch API key" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/api-keys/[id] - Update API key (name or status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, isActive } = body;

    // Build update data
    const updateData: { name?: string; isActive?: boolean } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 },
        );
      }
      updateData.name = name.trim();
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive must be a boolean" },
          { status: 400 },
        );
      }
      updateData.isActive = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(apiKey);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }
    console.error("Failed to update API key:", error);
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/api-keys/[id] - Delete/revoke API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "API key deleted" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }
    console.error("Failed to delete API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 },
    );
  }
}
