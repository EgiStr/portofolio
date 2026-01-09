"use client";

import Link from "next/link";
import { Folder, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

interface FolderRowProps {
  id: string;
  name: string;
  path: string;
  createdAt: Date;
  fileCount?: number;
  onDelete?: () => void;
  onRename?: () => void;
}

export function FolderRow({
  id,
  name,
  path,
  createdAt,
  fileCount = 0,
  onDelete,
  onRename,
}: FolderRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const href = `/drive${path}`;

  return (
    <div className="flex items-center px-4 py-3 hover:bg-secondary/50 transition-colors group">
      <Link href={href} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Folder className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground">
            {fileCount} {fileCount === 1 ? "item" : "items"}
          </p>
        </div>
      </Link>

      <div className="w-24 text-right text-sm text-muted-foreground">—</div>
      <div className="w-32 text-right text-sm text-muted-foreground">
        {formatDate(createdAt)}
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
                  onRename?.();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Rename
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
