import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

// GET: List all nodes
export async function GET() {
  try {
    const nodes = await prisma.storageNode.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        totalSpace: true,
        usedSpace: true,
        reservedSpace: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
        _count: {
          select: { files: true },
        },
      },
    });

    // Convert BigInt to string for JSON serialization
    const serializedNodes = nodes.map((node) => ({
      ...node,
      totalSpace: node.totalSpace.toString(),
      usedSpace: node.usedSpace.toString(),
      reservedSpace: node.reservedSpace.toString(),
    }));

    return NextResponse.json({ nodes: serializedNodes });
  } catch (error) {
    console.error("Get nodes error:", error);
    return NextResponse.json({ error: "Failed to get nodes" }, { status: 500 });
  }
}

// DELETE: Remove a node
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get("id");

    if (!nodeId) {
      return NextResponse.json(
        { error: "Node ID is required" },
        { status: 400 },
      );
    }

    // Check if node has files
    const fileCount = await prisma.eDSFile.count({
      where: { nodeId, deletedAt: null },
    });

    if (fileCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete node with existing files. Delete files first.",
        },
        { status: 400 },
      );
    }

    await prisma.storageNode.delete({
      where: { id: nodeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete node error:", error);
    return NextResponse.json(
      { error: "Failed to delete node" },
      { status: 500 },
    );
  }
}

// PATCH: Toggle node active status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodeId, isActive } = body;

    if (!nodeId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const node = await prisma.storageNode.update({
      where: { id: nodeId },
      data: { isActive },
    });

    return NextResponse.json({ node });
  } catch (error) {
    console.error("Update node error:", error);
    return NextResponse.json(
      { error: "Failed to update node" },
      { status: 500 },
    );
  }
}
