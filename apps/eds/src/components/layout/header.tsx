"use client";

import { Search, Bell, Upload, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./global-search";

interface HeaderProps {
  sidebarCollapsed?: boolean;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300",
        sidebarCollapsed ? "left-16" : "left-64",
      )}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Search */}
        <GlobalSearch />

        {/* Actions */}
        <div className="flex items-center gap-4 ml-6">
          <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </button>

          <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </button>

          <button className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
