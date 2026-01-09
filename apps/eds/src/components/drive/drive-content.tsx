"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Upload } from "lucide-react";
import { StorageWidget } from "@/components/layout/storage-widget";
import { FileExplorer } from "@/components/drive/file-explorer";
import { UploadDialog } from "@/components/drive/upload-dialog";
import { CreateFolderDialog } from "@/components/drive/create-folder-dialog";
import { Breadcrumbs } from "@/components/drive/breadcrumbs";
import { toast } from "sonner";

interface DriveContentProps {
  stats: {
    totalSpace: bigint;
    usedSpace: bigint;
    nodeCount: number;
  };
  folders: Array<{
    id: string;
    name: string;
    path: string;
    createdAt: Date;
    _count?: { files: number };
  }>;
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    size: bigint;
    uploadedAt: Date;
  }>;
  currentFolder?: {
    id: string;
    name: string;
    path: string;
  } | null;
  breadcrumbs?: Array<{
    id: string;
    name: string;
    path: string;
  }>;
}

export function DriveContent({
  stats,
  folders,
  files,
  currentFolder,
  breadcrumbs = [],
}: DriveContentProps) {
  const router = useRouter();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);

  const handleDownload = async (fileId: string) => {
    window.open(`/api/drive/files/${fileId}`, "_blank");
  };

  const handleDelete = async (id: string, type: "file" | "folder") => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const url =
        type === "file"
          ? `/api/drive/files/${id}`
          : `/api/drive/folders?id=${id}`;

      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success(`${type === "file" ? "File" : "Folder"} deleted`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const handleMove = useCallback(
    async (fileId: string, targetFolderId: string | null) => {
      try {
        const response = await fetch(`/api/drive/files/${fileId}/move`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: targetFolderId }),
        });

        if (!response.ok) {
          throw new Error("Failed to move file");
        }

        toast.success("File moved");
        router.refresh();
      } catch (error) {
        toast.error("Failed to move file");
      }
    },
    [router],
  );

  // Handle drop on breadcrumb
  const handleBreadcrumbDrop = useCallback(
    (targetFolderId: string | null) => {
      if (draggedFileId) {
        handleMove(draggedFileId, targetFolderId);
      }
      setDraggedFileId(null);
    },
    [draggedFileId, handleMove],
  );

  const handleUploadComplete = () => {
    router.refresh();
  };

  const handleFolderCreated = () => {
    router.refresh();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} onDrop={handleBreadcrumbDrop} />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {currentFolder ? currentFolder.name : "My Drive"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {files.length} files, {folders.length} folders
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFolderDialogOpen(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              <FolderPlus className="h-4 w-4" />
              New Folder
            </button>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
          </div>
        </div>

        {/* Storage Overview - only show on root */}
        {!currentFolder && (
          <StorageWidget
            totalSpace={stats.totalSpace}
            usedSpace={stats.usedSpace}
            nodeCount={stats.nodeCount}
          />
        )}

        {/* File Explorer */}
        <FileExplorer
          folders={folders}
          files={files}
          currentFolderId={currentFolder?.id}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onMove={handleMove}
          onDragStart={setDraggedFileId}
          onDragEnd={() => setDraggedFileId(null)}
          draggedFileId={draggedFileId}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        folderId={currentFolder?.id}
        onUploadComplete={handleUploadComplete}
      />

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        isOpen={isFolderDialogOpen}
        onClose={() => setIsFolderDialogOpen(false)}
        parentId={currentFolder?.id}
        onFolderCreated={handleFolderCreated}
      />
    </>
  );
}
