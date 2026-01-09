"use client";

import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Server, MoreVertical, Trash2, Power, RefreshCw } from "lucide-react";
import { useState } from "react";

interface NodeCardProps {
  id: string;
  email: string;
  totalSpace: string;
  usedSpace: string;
  isActive: boolean;
  fileCount: number;
  onToggle?: () => void;
  onDelete?: () => void;
  onSync?: () => void;
}

export function NodeCard({
  id,
  email,
  totalSpace,
  usedSpace,
  isActive,
  fileCount,
  onToggle,
  onDelete,
  onSync,
}: NodeCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const total = BigInt(totalSpace);
  const used = BigInt(usedSpace);
  const percentage =
    Number(total) > 0 ? Math.round((Number(used) / Number(total)) * 100) : 0;

  // Determine status color
  const getStatusColor = () => {
    if (!isActive) return "bg-muted-foreground";
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 transition-all duration-200",
        !isActive && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              isActive ? "bg-primary/10" : "bg-secondary",
            )}
          >
            <Server
              className={cn(
                "h-5 w-5",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>
          <div>
            <p className="font-medium text-sm truncate max-w-[200px]">
              {email}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("h-2 w-2 rounded-full", getStatusColor())} />
              <span className="text-xs text-muted-foreground">
                {isActive
                  ? percentage >= 90
                    ? "Almost Full"
                    : "Active"
                  : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
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
                    onSync?.();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sync Quota
                </button>
                <button
                  onClick={() => {
                    onToggle?.();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                >
                  <Power className="h-4 w-4" />
                  {isActive ? "Disable" : "Enable"}
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
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              percentage >= 90
                ? "bg-destructive"
                : percentage >= 70
                  ? "bg-yellow-500"
                  : "bg-gradient-to-r from-primary to-green-400",
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {formatBytes(used)} / {formatBytes(total)}
        </span>
        <span className="text-muted-foreground">{fileCount} files</span>
      </div>
    </div>
  );
}
