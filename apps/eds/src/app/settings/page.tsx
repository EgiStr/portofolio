import { prisma } from "@ecosystem/database";
import { DriveLayout } from "@/components/drive/drive-layout";
import { SettingsContent } from "@/components/settings/settings-content";

async function getStorageStats() {
  const nodes = await prisma.storageNode.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { files: true } },
    },
  });

  const total = nodes.reduce((acc, node) => acc + node.totalSpace, BigInt(0));
  const used = nodes.reduce((acc, node) => acc + node.usedSpace, BigInt(0));
  const fileCount = nodes.reduce((acc, node) => acc + node._count.files, 0);

  return {
    totalSpace: total.toString(),
    usedSpace: used.toString(),
    nodeCount: nodes.length,
    fileCount,
    nodes: nodes.map((n) => ({
      id: n.id,
      email: n.email,
      totalSpace: n.totalSpace.toString(),
      usedSpace: n.usedSpace.toString(),
      isActive: n.isActive,
    })),
  };
}

async function getActivityCount() {
  return prisma.eDSActivityLog.count();
}

export default async function SettingsPage() {
  const [stats, activityCount] = await Promise.all([
    getStorageStats(),
    getActivityCount(),
  ]);

  return (
    <DriveLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your storage configuration and preferences
          </p>
        </div>

        <SettingsContent stats={stats} activityCount={activityCount} />
      </div>
    </DriveLayout>
  );
}
