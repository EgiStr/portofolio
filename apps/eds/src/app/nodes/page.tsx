import { prisma } from "@ecosystem/database";
import { DriveLayout } from "@/components/drive/drive-layout";
import { NodeGrid } from "@/components/nodes/node-grid";
import { Plus, Server } from "lucide-react";
import Link from "next/link";

async function getNodes() {
  const nodes = await prisma.storageNode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { files: true } },
    },
  });

  return nodes.map((node) => ({
    id: node.id,
    email: node.email,
    totalSpace: node.totalSpace.toString(),
    usedSpace: node.usedSpace.toString(),
    isActive: node.isActive,
    fileCount: node._count.files,
  }));
}

export default async function NodesPage() {
  const nodes = await getNodes();

  return (
    <DriveLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Storage Nodes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your connected Google Drive accounts
            </p>
          </div>
          <Link
            href="/api/auth/google"
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Node
          </Link>
        </div>

        {/* Nodes Grid */}
        {nodes.length > 0 ? (
          <NodeGrid nodes={nodes} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No storage nodes</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Connect your first Google Drive account to start storing files
            </p>
            <Link
              href="/api/auth/google"
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Your First Node
            </Link>
          </div>
        )}

        {/* Info Section */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-medium mb-1">Connect Accounts</h3>
              <p className="text-sm text-muted-foreground">
                Add multiple Google accounts to create a storage pool
              </p>
            </div>
            <div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="font-medium mb-1">Automatic Distribution</h3>
              <p className="text-sm text-muted-foreground">
                Files are automatically stored in accounts with most free space
              </p>
            </div>
            <div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="font-medium mb-1">Unified Access</h3>
              <p className="text-sm text-muted-foreground">
                Access all your files from one place, regardless of storage
                location
              </p>
            </div>
          </div>
        </div>
      </div>
    </DriveLayout>
  );
}
