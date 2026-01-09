"use client";

import { useState } from "react";
import {
  MoreVertical,
  Download,
  Trash2,
  Edit2,
  Move,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileArchive,
  FileSpreadsheet,
} from "lucide-react";
import { formatBytes, formatDate, getFileIcon } from "@/lib/utils";

interface FileRowProps {
  id: string;
  name: string;
  mimeType: string;
  size: bigint;
  uploadedAt: Date;
  onDownload?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onMove?: () => void;
}

const iconMap: Record<string, any> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  pdf: FileText,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: FileText,
  archive: FileArchive,
  file: File,
};

export function FileRow({
  id,
  name,
  mimeType,
  size,
  uploadedAt,
  onDownload,
  onDelete,
  onRename,
  onMove,
}: FileRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const iconType = getFileIcon(mimeType);
  const Icon = iconMap[iconType] || File;

  return (
    <div className="flex items-center px-4 py-3 hover:bg-secondary/50 transition-colors group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground">{mimeType}</p>
        </div>
      </div>

      <div className="w-24 text-right text-sm text-muted-foreground">
        {formatBytes(size)}
      </div>
      <div className="w-32 text-right text-sm text-muted-foreground">
        {formatDate(uploadedAt)}
      </div>

      {/* Actions */}
      <div className="relative w-10 flex justify-end">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
              <button
                onClick={() => {
                  onDownload?.();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={() => {
                  onRename?.();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Rename
              </button>
              <button
                onClick={() => {
                  onMove?.();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <Move className="h-4 w-4" />
                Move
              </button>
              <hr className="my-1 border-border" />
              <button
                onClick={() => {
                  onDelete?.();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
