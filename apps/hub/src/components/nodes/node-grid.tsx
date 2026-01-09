"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NodeCard } from "@/components/nodes/node-card";
import { toast } from "sonner";

interface NodeData {
  id: string;
  email: string;
  totalSpace: string;
  usedSpace: string;
  isActive: boolean;
  fileCount: number;
}

interface NodeGridProps {
  nodes: NodeData[];
}

export function NodeGrid({ nodes: initialNodes }: NodeGridProps) {
  const router = useRouter();
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);

  const handleToggle = async (nodeId: string, currentIsActive: boolean) => {
    setLoadingNodeId(nodeId);
    try {
      const response = await fetch("/api/drive/nodes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, isActive: !currentIsActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update node");
      }

      toast.success(currentIsActive ? "Node disabled" : "Node enabled");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to toggle node",
      );
    } finally {
      setLoadingNodeId(null);
    }
  };

  const handleDelete = async (nodeId: string) => {
    if (!confirm("Are you sure you want to remove this node?")) return;

    setLoadingNodeId(nodeId);
    try {
      const response = await fetch(`/api/drive/nodes?id=${nodeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete node");
      }

      toast.success("Node removed");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete node",
      );
    } finally {
      setLoadingNodeId(null);
    }
  };

  const handleSync = async (nodeId: string) => {
    setLoadingNodeId(nodeId);
    try {
      const response = await fetch("/api/drive/nodes/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sync node");
      }

      toast.success("Quota synced successfully");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sync quota",
      );
    } finally {
      setLoadingNodeId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {initialNodes.map((node) => (
        <NodeCard
          key={node.id}
          id={node.id}
          email={node.email}
          totalSpace={node.totalSpace}
          usedSpace={node.usedSpace}
          isActive={node.isActive}
          fileCount={node.fileCount}
          onToggle={() => handleToggle(node.id, node.isActive)}
          onDelete={() => handleDelete(node.id)}
          onSync={() => handleSync(node.id)}
        />
      ))}
    </div>
  );
}
