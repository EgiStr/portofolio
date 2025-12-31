"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@ecosystem/ui";
import {
  Eye,
  TrendingUp,
  FileText,
  FolderKanban,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";

interface Stats {
  totalViews: number;
  uniqueVisitors: number;
  avgReadTime: number;
  bounceRate: number;
}

interface TopPost {
  title: string;
  views: number;
  readTime: number;
}

interface TopProject {
  title: string;
  clicks: number;
}

function StatCard({
  title,
  value,
  change,
  isUp,
  icon: Icon,
  suffix = "",
}: {
  title: string;
  value: string | number;
  change: number;
  isUp: boolean;
  icon: React.ElementType;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {value}
              {suffix}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div
          className={`flex items-center gap-1 mt-3 text-sm ${
            isUp ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {isUp ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          <span>{change}%</span>
          <span className="text-muted-foreground ml-1">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [topProjects, setTopProjects] = useState<TopProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/admin/stats/analytics");
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setTopPosts(data.topPosts || []);
          setTopProjects(data.topProjects || []);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your content performance and audience insights
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Page Views"
          value={(stats?.totalViews || 0).toLocaleString()}
          change={12.5}
          isUp={true}
          icon={Eye}
        />
        <StatCard
          title="Unique Visitors"
          value={(stats?.uniqueVisitors || 0).toLocaleString()}
          change={8.2}
          isUp={true}
          icon={Users}
        />
        <StatCard
          title="Avg. Read Time"
          value={stats?.avgReadTime.toFixed(1) || "0"}
          change={0.3}
          isUp={true}
          icon={Clock}
          suffix=" min"
        />
        <StatCard
          title="Bounce Rate"
          value={stats?.bounceRate || 0}
          change={2.4}
          isUp={false}
          icon={TrendingUp}
          suffix="%"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Blog Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Top Blog Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPosts.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No published posts yet
              </p>
            ) : (
              <div className="space-y-4">
                {topPosts.map((post, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {post.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {post.readTime} min read
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {post.views.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              Top Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No published projects yet
              </p>
            ) : (
              <div className="space-y-4">
                {topProjects.map((project, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <p className="text-sm font-medium text-foreground">
                        {project.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {project.clicks.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">clicks</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Note */}
      <div className="mt-8 p-4 bg-secondary/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> View counts are
          from real database. Visitor estimates, bounce rate, and project clicks
          are placeholder values. Connect to an analytics provider (e.g., Vercel
          Analytics, Google Analytics) for complete visitor tracking.
        </p>
      </div>
    </div>
  );
}
