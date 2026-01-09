import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UploadOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (file: any) => void;
  onError?: (error: Error) => void;
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

export function useDriveUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File, folderId?: string, options?: UploadOptions) => {
      setIsUploading(true);
      let uploadUrl: string | null = null;
      let nodeId: string | null = null;
      let reservationId: string | null = null;

      try {
        // 1. Init upload session
        const initRes = await fetch("/api/drive/upload/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            mimeType: file.type || "application/octet-stream",
            folderId,
          }),
        });

        if (!initRes.ok) {
          const error = await initRes.json();
          throw new Error(error.error || "Failed to initialize upload");
        }

        const initData = await initRes.json();
        uploadUrl = initData.uploadUrl;
        nodeId = initData.nodeId;
        reservationId = initData.reservationId;

        if (!uploadUrl) throw new Error("No upload URL returned");

        // 2. Upload chunks
        let start = 0;
        const total = file.size;
        let googleFileId: string | null = null;

        while (start < total) {
          const end = Math.min(start + CHUNK_SIZE, total);
          const chunk = file.slice(start, end);
          const contentLength = end - start;

          let attempts = 0;
          let success = false;

          while (attempts < 3 && !success) {
            try {
              const res = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                  "Content-Range": `bytes ${start}-${end - 1}/${total}`,
                },
                credentials: "omit",
                body: chunk,
              });

              // 308 Resume Incomplete (chunks) or 200/201 (final)
              if (res.status === 308) {
                success = true;
                start = end;
                const progress = Math.round((start / total) * 100);
                options?.onProgress?.(progress);
              } else if (res.ok) {
                // Final chunk
                success = true;
                start = end;
                const progress = 100;
                options?.onProgress?.(progress);

                const data = await res.json();
                googleFileId = data.id; // Capture ID from final response
              } else {
                throw new Error(`Upload failed with status ${res.status}`);
              }
            } catch (err) {
              attempts++;
              console.warn(`Chunk retry ${attempts}/3:`, err);
              if (attempts >= 3) throw err;
              await new Promise((r) => setTimeout(r, 1000 * attempts));
            }
          }
        }

        if (!googleFileId) {
          throw new Error("Upload completed but no File ID returned");
        }

        // 3. Finalize
        const finalizeRes = await fetch("/api/drive/upload/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            googleFileId,
            nodeId,
            reservationId,
            fileMeta: {
              name: file.name,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
              folderId,
            },
          }),
        });

        if (!finalizeRes.ok) {
          throw new Error("Failed to finalize upload");
        }

        const finalData = await finalizeRes.json();
        options?.onComplete?.(finalData.file);
      } catch (error) {
        console.error("Upload error:", error);
        options?.onError?.(
          error instanceof Error ? error : new Error("Unknown error"),
        );
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  return { uploadFile, isUploading };
}
