"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  X,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { toast } from "sonner";
import { useDriveUpload } from "@/hooks/use-drive-upload";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string;
  onUploadComplete?: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface FolderOption {
  id: string;
  name: string;
  path: string;
}

export function UploadDialog({
  isOpen,
  onClose,
  folderId,
  onUploadComplete,
}: UploadDialogProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    folderId,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available folders
  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      setSelectedFolderId(folderId);
    }
  }, [isOpen, folderId]);

  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/drive/folders");
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    }
  };

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadingFile[] = Array.from(fileList).map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const { uploadFile: uploadToDrive } = useDriveUpload();

  const uploadFile = async (uploadingFile: UploadingFile, index: number) => {
    const { file } = uploadingFile;

    // Update status to uploading
    setFiles((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, status: "uploading" as const, progress: 0 } : f,
      ),
    );

    await uploadToDrive(file, selectedFolderId, {
      onProgress: (progress) => {
        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, progress } : f)),
        );
      },
      onComplete: () => {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, status: "success" as const, progress: 100 }
              : f,
          ),
        );
        toast.success(`${file.name} uploaded successfully`);
      },
      onError: (error) => {
        console.error("Upload error:", error);
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? {
                  ...f,
                  status: "error" as const,
                  error: error.message || "Upload failed",
                }
              : f,
          ),
        );
        toast.error(`Failed to upload ${file.name}`);
      },
    });
  };

  const startUpload = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "pending") {
        await uploadFile(files[i], i);
      }
    }
    onUploadComplete?.();
  };

  const allComplete =
    files.length > 0 && files.every((f) => f.status === "success");
  const isUploading = files.some((f) => f.status === "uploading");
  const hasPending = files.some((f) => f.status === "pending");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Upload Files</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Folder Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload to folder
            </label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={selectedFolderId || ""}
                onChange={(e) =>
                  setSelectedFolderId(e.target.value || undefined)
                }
                className="w-full h-10 pl-10 pr-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="">Root (My Drive)</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.path}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-muted-foreground",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Files are uploaded via secure server proxy
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((uploadingFile, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    {uploadingFile.status === "success" ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : uploadingFile.status === "error" ? (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    ) : uploadingFile.status === "uploading" ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <File className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadingFile.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(uploadingFile.file.size)}
                      </span>
                      {uploadingFile.status === "uploading" && (
                        <>
                          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-green-400 transition-all duration-300"
                              style={{ width: `${uploadingFile.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-primary">
                            {uploadingFile.progress}%
                          </span>
                        </>
                      )}
                      {uploadingFile.status === "error" && (
                        <span className="text-xs text-destructive">
                          {uploadingFile.error}
                        </span>
                      )}
                    </div>
                  </div>

                  {uploadingFile.status === "pending" && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 rounded hover:bg-secondary transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
          >
            {allComplete ? "Done" : "Cancel"}
          </button>
          {hasPending && (
            <button
              onClick={startUpload}
              disabled={isUploading || files.length === 0}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading
                ? "Uploading..."
                : `Upload ${files.filter((f) => f.status === "pending").length} file(s)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
