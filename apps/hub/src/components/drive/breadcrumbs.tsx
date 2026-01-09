"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onDrop?: (targetFolderId: string | null) => void;
}

export function Breadcrumbs({ items, onDrop }: BreadcrumbsProps) {
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, id: string | null) => {
    e.preventDefault();
    setDropTarget(id);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData("fileId");
    if (fileId && onDrop) {
      // The parent component will handle the API call
      onDrop(targetFolderId);
    }
    setDropTarget(null);
  };

  return (
    <nav className="flex items-center gap-2 text-sm">
      <div
        onDragOver={(e) => handleDragOver(e, "root")}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
        className={cn(
          "rounded-lg transition-colors",
          dropTarget === "root" && "bg-primary/20 ring-2 ring-primary",
        )}
      >
        <Link
          href="/drive"
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          <span>My Drive</span>
        </Link>
      </div>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const href = `/drive${item.path}`;

        return (
          <div key={item.id} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, isLast ? item.id : item.id)}
              className={cn(
                "rounded-lg transition-colors",
                dropTarget === item.id && "bg-primary/20 ring-2 ring-primary",
              )}
            >
              {isLast ? (
                <span className="px-2 py-1 font-medium">{item.name}</span>
              ) : (
                <Link
                  href={href}
                  className="px-2 py-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground block"
                >
                  {item.name}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
