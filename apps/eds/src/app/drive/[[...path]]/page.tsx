import { prisma, type EDSFolder } from "@ecosystem/database";
import { DriveLayout } from "@/components/drive/drive-layout";
import { DriveContent } from "@/components/drive/drive-content";
import { notFound } from "next/navigation";

async function getStorageStats() {
  const nodes = await prisma.storageNode.findMany({
    where: { isActive: true },
  });

  const total = nodes.reduce((acc, node) => acc + node.totalSpace, BigInt(0));
  const used = nodes.reduce((acc, node) => acc + node.usedSpace, BigInt(0));

  return {
    totalSpace: total,
    usedSpace: used,
    nodeCount: nodes.length,
  };
}

async function getFolderByPath(pathSegments: string[]) {
  if (pathSegments.length === 0) return null;

  const path = "/" + pathSegments.join("/");
  const folder = await prisma.eDSFolder.findFirst({
    where: { path },
  });

  return folder;
}

async function getFolderContents(folderId: string | null) {
  const [folders, files] = await Promise.all([
    prisma.eDSFolder.findMany({
      where: { parentId: folderId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { files: true } },
      },
    }),
    prisma.eDSFile.findMany({
      where: { folderId: folderId, deletedAt: null },
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  return { folders, files };
}

async function buildBreadcrumbs(folderId: string | null) {
  if (!folderId) return [];

  const breadcrumbs: Array<{ id: string; name: string; path: string }> = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder: EDSFolder | null = await prisma.eDSFolder.findUnique({
      where: { id: currentId },
    });

    if (!folder) break;

    breadcrumbs.unshift({
      id: folder.id,
      name: folder.name,
      path: folder.path,
    });

    currentId = folder.parentId;
  }

  return breadcrumbs;
}

export default async function FolderPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;

  const [stats, currentFolder] = await Promise.all([
    getStorageStats(),
    getFolderByPath(path),
  ]);

  // If path provided but folder not found, show 404
  if (path.length > 0 && !currentFolder) {
    notFound();
  }

  const [contents, breadcrumbs] = await Promise.all([
    getFolderContents(currentFolder?.id || null),
    buildBreadcrumbs(currentFolder?.id || null),
  ]);

  return (
    <DriveLayout>
      <DriveContent
        stats={stats}
        folders={contents.folders}
        files={contents.files}
        currentFolder={currentFolder}
        breadcrumbs={breadcrumbs}
      />
    </DriveLayout>
  );
}
