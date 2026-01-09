import { prisma } from "@ecosystem/database";
import { DriveLayout } from "@/components/drive/drive-layout";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { Activity } from "lucide-react";

async function getRecentActivity() {
  const activities = await prisma.eDSActivityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return activities;
}

export default async function ActivityPage() {
  const activities = await getRecentActivity();

  return (
    <DriveLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Recent file operations and system events
          </p>
        </div>

        {/* Activity Feed */}
        {activities.length > 0 ? (
          <ActivityTimeline activities={activities} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No activity yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your file operations and system events will appear here
            </p>
          </div>
        )}
      </div>
    </DriveLayout>
  );
}
