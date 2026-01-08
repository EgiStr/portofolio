"use client";

import { useState, useRef, useCallback } from "react";
import { Button, Label } from "@ecosystem/ui";
import { Upload, X, Loader2, FileText, File } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: "projects" | "blog" | "avatars" | "certificates";
  folder?: string;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({
  value,
  onChange,
  bucket = "certificates",
  folder = "certificates",
  label = "Certificate File",
  accept = "image/*,application/pdf",
  maxSize = 10,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (url: string) => {
    if (url.endsWith(".pdf")) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <File className="w-8 h-8 text-primary" />;
  };

  const getFileName = (url: string) => {
    return url.split("/").pop() || "file";
  };

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Use JPEG, PNG, WebP, GIF, or PDF.");
        return;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`File too large. Maximum size is ${maxSize}MB.`);
        return;
      }

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", bucket);
        if (folder) formData.append("folder", folder);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        onChange(data.url);
        toast.success("File uploaded successfully!");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload file",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [bucket, folder, onChange, maxSize],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleUpload(e.dataTransfer.files[0]);
      }
    },
    [handleUpload],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleUpload(e.target.files[0]);
      }
    },
    [handleUpload],
  );

  const handleRemove = useCallback(() => {
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onChange]);

  const handleDownload = useCallback(() => {
    if (value) {
      window.open(value, "_blank");
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {value ? (
        // Preview Mode
        <div className="relative w-full rounded-lg overflow-hidden bg-secondary border border-border p-4">
          <div className="flex items-center gap-3">
            {getFileIcon(value)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {getFileName(value)}
              </p>
              <p className="text-xs text-muted-foreground">
                {value.endsWith(".pdf") ? "PDF Document" : "Image File"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                View
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                Replace
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Upload Mode
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            w-full min-h-[120px]
            border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center gap-2 p-6
            cursor-pointer transition-colors
            ${
              dragActive
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 bg-secondary/50"
            }
            ${isUploading ? "pointer-events-none opacity-50" : ""}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <FileText className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                {dragActive ? "Drop file here" : "Click or drag file to upload"}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                PDF, JPEG, PNG, WebP, GIF • Max {maxSize}MB
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
