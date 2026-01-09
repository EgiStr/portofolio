"use client";

import { useState, useCallback } from "react";
import { FileRow } from "./file-row";
import { FolderRow } from "./folder-row";
import { FolderOpen, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileData {
  id: string;
  name: string;
  mimeType: string;
  size: bigint;
  uploadedAt: Date;
}

interface FolderData {
  id: string;
  name: string;
  path: string;
  createdAt: Date;
  _count?: { files: number };
}

interface UploadProgress {
  total: number;
  completed: number;
  current: string;
}

interface FileExplorerProps {
  folders: FolderData[];
  files: FileData[];
  currentFolderId?: string | null;
  onDownload?: (fileId: string) => void;
  onDelete?: (id: string, type: "file" | "folder") => void;
  onRename?: (id: string, type: "file" | "folder") => void;
  onMove?: (fileId: string, targetFolderId: string | null) => void;
  onDragStart?: (fileId: string) => void;
  onDragEnd?: () => void;
  draggedFileId?: string | null;
  onUploadComplete?: () => void;
}

interface FileEntry {
  file: File;
  relativePath: string;
}

// Helper to read directory entries recursively
async function readDirectoryRecursive(
  entry: FileSystemDirectoryEntry,
  path: string = "",
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  const reader = entry.createReader();

  const readEntries = (): Promise<FileSystemEntry[]> => {
    return new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
  };

  let batch: FileSystemEntry[];
  do {
    batch = await readEntries();
    for (const item of batch) {
      const itemPath = path ? `${path}/${item.name}` : item.name;
      if (item.isFile) {
        const fileEntry = item as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
        entries.push({ file, relativePath: itemPath });
      } else if (item.isDirectory) {
        const dirEntry = item as FileSystemDirectoryEntry;
        const subEntries = await readDirectoryRecursive(dirEntry, itemPath);
        entries.push(...subEntries);
      }
    }
  } while (batch.length > 0);

  return entries;
}

// Helper to create folder structure
async function ensureFolderExists(
  folderPath: string,
  parentId: string | null,
): Promise<string> {
  const response = await fetch("/api/drive/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: folderPath.split("/").pop(), parentId }),
  });

  if (!response.ok) {
    const existing = await fetch(
      `/api/drive/folders?path=${encodeURIComponent(folderPath)}`,
    );
    if (existing.ok) {
      const data = await existing.json();
      return data.folder?.id || null;
    }
    throw new Error("Failed to create folder");
  }

  const data = await response.json();
  return data.folder.id;
}

export function FileExplorer({
  folders,
  files,
  currentFolderId,
  onDownload,
  onDelete,
  onRename,
  onMove,
  onDragStart,
  onDragEnd,
  draggedFileId,
  onUploadComplete,
}: FileExplorerProps) {
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [isDragOver, setIsDragOver] = useState(false);

  const isEmpty = folders.length === 0 && files.length === 0;

  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData("fileId", fileId);
    onDragStart?.(fileId);
  };

  const handleDragEnd = () => {
    setDropTargetId(null);
    onDragEnd?.();
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetId(null);
  };

  const handleFolderDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const fileId = e.dataTransfer.getData("fileId");
    if (fileId && onMove) {
      onMove(fileId, targetFolderId);
    }
    setDropTargetId(null);
    onDragEnd?.();
  };

  // Handle drop on explorer area (for uploading)
  const handleExplorerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Check if it's an external file/folder drop
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  const handleExplorerDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only set false if leaving the main container
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragOver(false);
    }
  }, []);

  const handleExplorerDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      // Check if it's a file move (internal) or file upload (external)
      const fileId = e.dataTransfer.getData("fileId");
      if (fileId) {
        // Internal file move - ignore, handled by folder drop
        return;
      }

      const items = Array.from(e.dataTransfer.items);
      const fileEntries: FileEntry[] = [];

      setIsUploading(true);
      setUploadProgress({
        total: 0,
        completed: 0,
        current: "Reading files...",
      });

      try {
        // Process dropped items
        for (const item of items) {
          if (item.kind === "file") {
            const entry = item.webkitGetAsEntry?.();
            if (entry) {
              if (entry.isDirectory) {
                // Recursively read directory
                const dirEntry = entry as FileSystemDirectoryEntry;
                const entries = await readDirectoryRecursive(
                  dirEntry,
                  entry.name,
                );
                fileEntries.push(...entries);
              } else {
                // Single file
                const file = item.getAsFile();
                if (file) {
                  fileEntries.push({ file, relativePath: file.name });
                }
              }
            }
          }
        }

        if (fileEntries.length === 0) {
          toast.error("No files to upload");
          return;
        }

        setUploadProgress({
          total: fileEntries.length,
          completed: 0,
          current: "",
        });

        // Build folder structure map
        const folderMap = new Map<string, string>(); // path -> id
        folderMap.set("", currentFolderId || ""); // Root

        // Upload files
        for (let i = 0; i < fileEntries.length; i++) {
          const { file, relativePath } = fileEntries[i];
          const pathParts = relativePath.split("/");
          const fileName = pathParts.pop()!;
          const folderPath = pathParts.join("/");

          setUploadProgress({
            total: fileEntries.length,
            completed: i,
            current: fileName,
          });

          // Ensure parent folder exists
          let targetFolderId = currentFolderId || null;
          if (folderPath) {
            // Create folders if needed
            const folderParts = folderPath.split("/");
            let currentPath = "";
            let parentId = currentFolderId || null;

            for (const part of folderParts) {
              currentPath = currentPath ? `${currentPath}/${part}` : part;

              if (!folderMap.has(currentPath)) {
                try {
                  const response = await fetch("/api/drive/folders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: part, parentId }),
                  });

                  if (response.ok) {
                    const data = await response.json();
                    folderMap.set(currentPath, data.folder.id);
                    parentId = data.folder.id;
                  } else if (response.status === 409) {
                    // Folder exists, get it from the list
                    const listRes = await fetch("/api/drive/folders");
                    const listData = await listRes.json();
                    const existing = listData.folders?.find(
                      (f: any) => f.name === part && f.parentId === parentId,
                    );
                    if (existing) {
                      folderMap.set(currentPath, existing.id);
                      parentId = existing.id;
                    }
                  }
                } catch (err) {
                  console.error("Folder creation error:", err);
                }
              } else {
                parentId = folderMap.get(currentPath) || null;
              }
            }
            targetFolderId = parentId;
          }

          // Upload file
          const formData = new FormData();
          formData.append("file", file);
          if (targetFolderId) {
            formData.append("folderId", targetFolderId);
          }

          try {
            const response = await fetch("/api/drive/upload", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              console.error(`Failed to upload ${fileName}`);
            }
          } catch (err) {
            console.error(`Upload error for ${fileName}:`, err);
          }
        }

        setUploadProgress({
          total: fileEntries.length,
          completed: fileEntries.length,
          current: "Complete!",
        });

        toast.success(`Uploaded ${fileEntries.length} files`);
        onUploadComplete?.();
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload files");
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(null);
        }, 1000);
      }
    },
    [currentFolderId, onUploadComplete],
  );

  if (isEmpty && !isUploading) {
    return (
      <div
        onDragOver={handleExplorerDragOver}
        onDragLeave={handleExplorerDragLeave}
        onDrop={handleExplorerDrop}
        className={cn(
          "flex flex-col items-center justify-center py-20 text-center glass rounded-2xl transition-colors",
          isDragOver && "bg-primary/10 ring-2 ring-primary ring-dashed",
        )}
      >
        <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          {isDragOver ? (
            <Upload className="h-8 w-8 text-primary animate-bounce" />
          ) : (
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <h3 className="text-lg font-medium mb-2">
          {isDragOver ? "Drop files or folders here" : "This folder is empty"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isDragOver
            ? "Release to upload files and folders with their structure"
            : "Drag files or folders here, or use the Upload button"}
        </p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleExplorerDragOver}
      onDragLeave={handleExplorerDragLeave}
      onDrop={handleExplorerDrop}
      className={cn(
        "glass rounded-2xl overflow-hidden transition-colors relative",
        isDragOver && "ring-2 ring-primary ring-dashed",
      )}
    >
      {/* Upload Progress Overlay */}
      {isUploading && uploadProgress && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-sm font-medium mb-1">
              Uploading {uploadProgress.completed} / {uploadProgress.total}{" "}
              files
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {uploadProgress.current}
            </p>
            <div className="w-48 h-2 bg-secondary rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${(uploadProgress.completed / uploadProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Drop Overlay */}
      {isDragOver && !isUploading && (
        <div className="absolute inset-0 bg-primary/10 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Upload className="h-10 w-10 mx-auto mb-2 text-primary animate-bounce" />
            <p className="text-sm font-medium">
              Drop files or folders to upload
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-border bg-secondary/30 text-sm font-medium text-muted-foreground">
        <div className="flex-1">Name</div>
        <div className="w-24 text-right">Size</div>
        <div className="w-32 text-right">Modified</div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="divide-y divide-border">
        {folders.map((folder) => (
          <div
            key={folder.id}
            onDragOver={(e) => handleDragOver(e, folder.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleFolderDrop(e, folder.id)}
            className={cn(
              "transition-colors",
              dropTargetId === folder.id &&
                "bg-primary/10 ring-2 ring-inset ring-primary/50",
            )}
          >
            <FolderRow
              {...folder}
              fileCount={folder._count?.files}
              onDelete={() => onDelete?.(folder.id, "folder")}
              onRename={() => onRename?.(folder.id, "folder")}
            />
          </div>
        ))}
        {files.map((file) => (
          <div
            key={file.id}
            draggable
            onDragStart={(e) => handleDragStart(e, file.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "transition-opacity cursor-grab active:cursor-grabbing",
              draggedFileId === file.id && "opacity-50",
            )}
          >
            <FileRow
              {...file}
              onDownload={() => onDownload?.(file.id)}
              onDelete={() => onDelete?.(file.id, "file")}
              onRename={() => onRename?.(file.id, "file")}
              onMove={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
