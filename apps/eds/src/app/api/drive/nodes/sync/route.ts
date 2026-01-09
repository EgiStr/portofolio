import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";
import { getDriveClient, getStorageQuota } from "@/lib/google-drive";

// POST: Sync a node's quota from Google Drive
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodeId } = body;

    if (!nodeId) {
      return NextResponse.json(
        { error: "Node ID is required" },
        { status: 400 },
      );
    }

    // Get node
    const node = await prisma.storageNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    // Get drive client (handles token refresh)
    const drive = await getDriveClient(nodeId);

    // Fetch storage quota from Google
    const quota = await getStorageQuota(drive);

    // Update node in database
    const updatedNode = await prisma.storageNode.update({
      where: { id: nodeId },
      data: {
        totalSpace: quota.total,
        usedSpace: quota.used,
        lastSyncAt: new Date(),
      },
    });

    // Log activity
    await prisma.eDSActivityLog.create({
      data: {
        action: "NODE_SYNC",
        targetType: "NODE",
        targetId: nodeId,
        metadata: {
          email: node.email,
          totalSpace: quota.total.toString(),
          usedSpace: quota.used.toString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      node: {
        id: updatedNode.id,
        email: updatedNode.email,
        totalSpace: updatedNode.totalSpace.toString(),
        usedSpace: updatedNode.usedSpace.toString(),
        lastSyncAt: updatedNode.lastSyncAt,
      },
    });
  } catch (error) {
    console.error("Node sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync node quota" },
      { status: 500 },
    );
  }
}
