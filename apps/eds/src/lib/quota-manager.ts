import { prisma } from "@ecosystem/database";

export interface NodeQuota {
  id: string;
  email: string;
  totalSpace: bigint;
  usedSpace: bigint;
  reservedSpace: bigint;
  availableSpace: bigint;
}

// Get all active nodes with their available space
export async function getActiveNodes(): Promise<NodeQuota[]> {
  const nodes = await prisma.storageNode.findMany({
    where: { isActive: true },
    orderBy: { usedSpace: "asc" },
  });

  return nodes.map((node) => ({
    id: node.id,
    email: node.email,
    totalSpace: node.totalSpace,
    usedSpace: node.usedSpace,
    reservedSpace: node.reservedSpace,
    availableSpace: node.totalSpace - node.usedSpace - node.reservedSpace,
  }));
}

// Select the best node for upload based on "Most Space Available First" strategy
export async function selectNodeForUpload(
  fileSize: bigint,
): Promise<NodeQuota | null> {
  const nodes = await getActiveNodes();

  // Filter nodes with enough space and sort by available space (descending)
  const eligibleNodes = nodes
    .filter((node) => node.availableSpace >= fileSize)
    .sort((a, b) => Number(b.availableSpace - a.availableSpace));

  if (eligibleNodes.length === 0) {
    return null;
  }

  return eligibleNodes[0];
}

// Select node for upload with fallback support (excludes failed nodes)
export async function selectNodeForUploadWithFallback(
  fileSize: bigint,
  excludeNodeIds: string[] = [],
): Promise<NodeQuota | null> {
  const nodes = await getActiveNodes();

  // Filter nodes with enough space, exclude failed nodes, sort by available space
  const eligibleNodes = nodes
    .filter(
      (node) =>
        node.availableSpace >= fileSize && !excludeNodeIds.includes(node.id),
    )
    .sort((a, b) => Number(b.availableSpace - a.availableSpace));

  return eligibleNodes[0] || null;
}

// Create a reservation for concurrent upload handling
export async function createReservation(
  nodeId: string,
  size: bigint,
): Promise<string> {
  // Reservation expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const reservation = await prisma.eDSReservation.create({
    data: {
      nodeId,
      size,
      expiresAt,
    },
  });

  // Update reserved space on node
  await prisma.storageNode.update({
    where: { id: nodeId },
    data: {
      reservedSpace: {
        increment: size,
      },
    },
  });

  return reservation.id;
}

// Release a reservation after upload completes or fails
export async function releaseReservation(reservationId: string): Promise<void> {
  const reservation = await prisma.eDSReservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) return;

  // Decrease reserved space
  await prisma.storageNode.update({
    where: { id: reservation.nodeId },
    data: {
      reservedSpace: {
        decrement: reservation.size,
      },
    },
  });

  // Delete reservation
  await prisma.eDSReservation.delete({
    where: { id: reservationId },
  });
}

// Finalize upload - update used space and create file record
export async function finalizeUpload(params: {
  nodeId: string;
  reservationId: string;
  googleFileId: string;
  name: string;
  slug: string;
  mimeType: string;
  size: bigint;
  folderId?: string;
}) {
  const {
    nodeId,
    reservationId,
    googleFileId,
    name,
    slug,
    mimeType,
    size,
    folderId,
  } = params;

  // Create file record
  const file = await prisma.eDSFile.create({
    data: {
      name,
      slug,
      mimeType,
      size,
      googleFileId,
      nodeId,
      folderId,
    },
  });

  // Update node used space
  await prisma.storageNode.update({
    where: { id: nodeId },
    data: {
      usedSpace: {
        increment: size,
      },
    },
  });

  // Release reservation
  await releaseReservation(reservationId);

  // Log activity
  await prisma.eDSActivityLog.create({
    data: {
      action: "UPLOAD",
      targetType: "FILE",
      targetId: file.id,
      metadata: { name, size: size.toString(), mimeType },
    },
  });

  return file;
}

// Get total storage stats across all nodes
export async function getTotalStorageStats() {
  const nodes = await prisma.storageNode.findMany({
    where: { isActive: true },
  });

  const total = nodes.reduce((acc, node) => acc + node.totalSpace, BigInt(0));
  const used = nodes.reduce((acc, node) => acc + node.usedSpace, BigInt(0));

  return {
    totalSpace: total,
    usedSpace: used,
    availableSpace: total - used,
    nodeCount: nodes.length,
  };
}
