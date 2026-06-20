"use client";

import * as React from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "./button";
import { Label } from "./label";
import { cn } from "../lib/utils";

interface ResumeUploadProps {
  value: string;
  onChange: (url: string, meta?: { fileName: string; size: number }) => void;
  label?: string;
  bucket?: string;
  folder?: string;
  className?: string;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_MIME = "application/pdf";

/**
 * ResumeUpload
 * ------------
 * PDF-only file uploader. Posts the file to /api/upload with the given
 * bucket/folder, expects { url } in the response, and notifies the parent
 * via onChange. Displays the current file with a remove button.
 *
 * Lives in @ecosystem/ui so it can be reused by any app that mounts it
 * behind an authenticated /api/upload route.
 */
export function ResumeUpload({
  value,
  onChange,
  label = "Resume / CV",
  bucket = "eggisatria.dev",
  folder = "resumes",
  className,
}: ResumeUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [fileName, setFileName] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset input value so the same file can be re-selected later
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    if (file.type !== ACCEPTED_MIME) {
      const msg = "Only PDF files are allowed.";
      setError(msg);
      window.alert(msg);
      return;
    }
    if (file.size > MAX_SIZE) {
      const msg = "File too large. Maximum size is 10 MB.";
      setError(msg);
      window.alert(msg);
      return;
    }

    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", bucket);
      fd.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Upload failed");
      }

      onChange(data.url, { fileName: file.name, size: file.size });
      setFileName(file.name);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to upload resume";
      setError(msg);
      window.alert(msg);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    onChange("");
    setFileName("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleReplace() {
    inputRef.current?.click();
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>

      {value ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-secondary/30">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-sm hover:underline"
          >
            {fileName || value.split("/").pop() || "Resume"}
          </a>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReplace}
            disabled={uploading}
            aria-label="Replace resume"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span className="ml-1 hidden sm:inline">Replace</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={uploading}
            aria-label="Remove resume"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <label
          className={cn(
            "flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            "hover:border-primary hover:bg-primary/5",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          <span className="text-sm">
            {uploading ? "Uploading..." : "Click to upload PDF (max 10MB)"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MIME}
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          PDF only, max 10 MB. Stored in{" "}
          <code>
            {bucket}/{folder}/
          </code>
          .
        </p>
      )}
    </div>
  );
}
