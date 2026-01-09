"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

export function DriveLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header sidebarCollapsed={sidebarCollapsed} />
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          sidebarCollapsed ? "pl-16" : "pl-64",
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
