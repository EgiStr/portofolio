"use client";

import { useState, useRef, useCallback } from "react";
import { Button, Label } from "@ecosystem/ui";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: "projects" | "blog" | "avatars";
  folder?: string;
  label?: string;
  aspectRatio?: "video" | "square" | "banner";
}

const ASPECT_RATIOS = {
  video: "aspect-video", // 16:9
  square: "aspect-square", // 1:1
  banner: "aspect-[3/1]", // 3:1
};

export function ImageUpload({
  value,
  onChange,
  bucket = "blog",
  folder = "",
  label = "Cover Image",
  aspectRatio = "video",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 5MB.");
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
        toast.success("Image uploaded successfully!");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload image",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [bucket, folder, onChange],
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

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {value ? (
        // Preview Mode
        <div
          className={`relative ${ASPECT_RATIOS[aspectRatio]} w-full rounded-lg overflow-hidden bg-secondary border border-border`}
        >
          <Image
            src={value}
            alt="Uploaded image"
            fill
            className="object-cover"
            unoptimized // For external URLs
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
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
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
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
            ${ASPECT_RATIOS[aspectRatio]} w-full
            border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center gap-2
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
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {dragActive
                  ? "Drop image here"
                  : "Click or drag image to upload"}
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, GIF • Max 5MB
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
