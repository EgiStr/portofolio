"use client";

import {
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  FolderPlus,
  Server,
  RefreshCw,
  FileText,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: any;
  createdAt: Date;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const actionConfig: Record<
  string,
  { icon: any; color: string; bgColor: string; label: string }
> = {
  UPLOAD: {
    icon: ArrowUpCircle,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    label: "Uploaded",
  },
  DOWNLOAD: {
    icon: ArrowDownCircle,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    label: "Downloaded",
  },
  DELETE: {
    icon: Trash2,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Deleted",
  },
  FOLDER_CREATE: {
    icon: FolderPlus,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    label: "Created folder",
  },
  NODE_ADDED: {
    icon: Server,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    label: "Added node",
  },
  NODE_SYNC: {
    icon: RefreshCw,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    label: "Synced quota",
  },
};

const targetIcons: Record<string, any> = {
  FILE: FileText,
  FOLDER: Folder,
  NODE: Server,
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTargetName(activity: Activity): string {
  if (activity.metadata?.name) return activity.metadata.name;
  if (activity.metadata?.email) return activity.metadata.email;
  return activity.targetType.toLowerCase();
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="space-y-1">
        {activities.map((activity, index) => {
          const config = actionConfig[activity.action] || {
            icon: FileText,
            color: "text-muted-foreground",
            bgColor: "bg-secondary",
            label: activity.action,
          };
          const Icon = config.icon;
          const TargetIcon = targetIcons[activity.targetType] || FileText;
          const isLast = index === activities.length - 1;

          return (
            <div key={activity.id} className="relative flex gap-4 group">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-5 top-12 w-0.5 h-[calc(100%-24px)] bg-border" />
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                  config.bgColor,
                )}
              >
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      <span className={config.color}>{config.label}</span>
                      <span className="text-muted-foreground"> • </span>
                      <span className="inline-flex items-center gap-1.5">
                        <TargetIcon className="h-4 w-4 text-muted-foreground" />
                        {getTargetName(activity)}
                      </span>
                    </p>
                    {activity.metadata?.size && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatBytes(BigInt(activity.metadata.size))}
                        {activity.metadata.mimeType && (
                          <span> • {activity.metadata.mimeType}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatBytes(bytes: bigint): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Number(bytes);
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}
