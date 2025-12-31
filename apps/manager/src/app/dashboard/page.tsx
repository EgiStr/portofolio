"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@ecosystem/ui";
import { FolderKanban, FileText, Eye, TrendingUp, Loader2 } from "lucide-react";

interface Stats {
  totalProjects: number;
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  avgReadingTime: number;
}

interface Activity {
  type: "post" | "project";
  action: string;
  title: string;
  time: string;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Projects",
      value: stats?.totalProjects.toString() || "0",
      icon: FolderKanban,
      change: "From database",
      changeType: "neutral",
    },
    {
      name: "Blog Posts",
      value: stats?.totalPosts.toString() || "0",
      icon: FileText,
      change: `${stats?.publishedPosts || 0} published`,
      changeType: "positive",
    },
    {
      name: "Total Views",
      value: stats?.totalViews.toLocaleString() || "0",
      icon: Eye,
      change: "All time",
      changeType: "positive",
    },
    {
      name: "Avg. Read Time",
      value: `${stats?.avgReadingTime.toFixed(1) || "0"} min`,
      icon: TrendingUp,
      change: `Based on ${stats?.publishedPosts || 0} posts`,
      changeType: "neutral",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s an overview of your content.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p
                className={`text-xs mt-3 ${
                  stat.changeType === "positive"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No recent activity
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "post"
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="text-muted-foreground">
                          {activity.action}:
                        </span>{" "}
                        {activity.title}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
