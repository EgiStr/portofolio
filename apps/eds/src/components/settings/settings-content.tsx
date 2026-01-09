"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HardDrive,
  Server,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NodeData {
  id: string;
  email: string;
  totalSpace: string;
  usedSpace: string;
  isActive: boolean;
}

interface SettingsContentProps {
  stats: {
    totalSpace: string;
    usedSpace: string;
    nodeCount: number;
    fileCount: number;
    nodes: NodeData[];
  };
  activityCount: number;
}

function formatBytes(bytesStr: string): string {
  const bytes = BigInt(bytesStr);
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Number(bytes);
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

export function SettingsContent({
  stats,
  activityCount,
}: SettingsContentProps) {
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);

  const total = BigInt(stats.totalSpace);
  const used = BigInt(stats.usedSpace);
  const percentage =
    Number(total) > 0 ? Math.round((Number(used) / Number(total)) * 100) : 0;

  const handleClearActivity = async () => {
    if (
      !confirm(
        `Are you sure you want to clear all ${activityCount} activity logs? This cannot be undone.`,
      )
    )
      return;

    setIsClearing(true);
    try {
      const response = await fetch("/api/activity", { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to clear logs");
      toast.success("Activity logs cleared");
      router.refresh();
    } catch (error) {
      toast.error("Failed to clear activity logs");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Storage Overview */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          Storage Overview
        </h2>

        <div className="flex items-center gap-8">
          {/* Donut Chart */}
          <div className="relative h-32 w-32 flex-shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                className="stroke-secondary"
                strokeWidth="3"
              />
              {/* Progress circle */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                className={cn(
                  "transition-all duration-500",
                  percentage >= 90
                    ? "stroke-destructive"
                    : percentage >= 70
                      ? "stroke-yellow-500"
                      : "stroke-primary",
                )}
                strokeWidth="3"
                strokeDasharray={`${percentage} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{percentage}%</span>
              <span className="text-xs text-muted-foreground">Used</span>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Used</span>
              <span className="font-medium">
                {formatBytes(stats.usedSpace)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-medium">
                {formatBytes(stats.totalSpace)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available</span>
              <span className="font-medium text-primary">
                {formatBytes((total - used).toString())}
              </span>
            </div>
          </div>
        </div>

        {/* Node breakdown */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-medium mb-3">Node Distribution</h3>
          <div className="space-y-2">
            {stats.nodes.map((node) => {
              const nodeTotal = BigInt(node.totalSpace);
              const nodeUsed = BigInt(node.usedSpace);
              const nodePercentage =
                Number(nodeTotal) > 0
                  ? Math.round((Number(nodeUsed) / Number(nodeTotal)) * 100)
                  : 0;

              return (
                <div key={node.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs truncate max-w-[150px]">
                        {node.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {nodePercentage}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          nodePercentage >= 90
                            ? "bg-destructive"
                            : nodePercentage >= 70
                              ? "bg-yellow-500"
                              : "bg-primary",
                        )}
                        style={{ width: `${nodePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats & Actions */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{stats.nodeCount}</p>
            <p className="text-sm text-muted-foreground">Storage Nodes</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold">{stats.fileCount}</p>
            <p className="text-sm text-muted-foreground">Total Files</p>
          </div>
        </div>

        {/* System Status */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage Nodes</span>
              <span className="flex items-center gap-1.5 text-sm text-green-400">
                <CheckCircle className="h-4 w-4" />
                {stats.nodeCount} Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Activity Logs</span>
              <span className="text-sm text-muted-foreground">
                {activityCount} entries
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass rounded-2xl p-6 border border-destructive/30">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Destructive actions that cannot be undone
          </p>
          <button
            onClick={handleClearActivity}
            disabled={isClearing || activityCount === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-destructive/10 text-destructive hover:bg-destructive/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <Trash2 className="h-4 w-4" />
            {isClearing
              ? "Clearing..."
              : `Clear Activity Logs (${activityCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
