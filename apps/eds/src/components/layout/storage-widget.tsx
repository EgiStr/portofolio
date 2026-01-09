"use client";

import { formatBytes } from "@/lib/utils";
import { HardDrive, TrendingUp } from "lucide-react";

interface StorageWidgetProps {
  totalSpace: bigint;
  usedSpace: bigint;
  nodeCount: number;
}

export function StorageWidget({
  totalSpace,
  usedSpace,
  nodeCount,
}: StorageWidgetProps) {
  const totalNum = Number(totalSpace);
  const usedNum = Number(usedSpace);
  const percentage = totalNum > 0 ? Math.round((usedNum / totalNum) * 100) : 0;

  // Calculate the circumference for the donut chart
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Storage Overview</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HardDrive className="h-4 w-4" />
          <span>{nodeCount} nodes</span>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Donut Chart */}
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90">
            {/* Background circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{percentage}%</span>
            <span className="text-xs text-muted-foreground">used</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Used</span>
              <span className="font-medium">{formatBytes(usedSpace)}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-green-400 transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Capacity</span>
            <span className="font-medium">{formatBytes(totalSpace)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available</span>
            <span className="font-medium text-primary">
              {formatBytes(totalSpace - usedSpace)}
            </span>
          </div>
        </div>
      </div>

      {/* Trend indicator */}
      <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-2 text-sm">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">
          Storage growing at normal rate
        </span>
      </div>
    </div>
  );
}
