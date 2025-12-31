import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";

// GET /api/admin/stats - Dashboard Overview Stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parallelize data fetching
    const [
      totalProjects,
      totalPosts,
      publishedPosts,
      totalViews,
      avgReadingTimeResult,
      recentProjects,
      recentPosts,
    ] = await Promise.all([
      // Counts
      prisma.project.count(),
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.blogView.count(),

      // Average Reading Time
      prisma.blogPost.aggregate({
        _avg: { readingTime: true },
        where: { published: true },
      }),

      // Recent Activity - Projects
      prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { title: true, createdAt: true },
      }),

      // Recent Activity - Posts
      prisma.blogPost.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { title: true, createdAt: true },
      }),
    ]);

    // Merge and sort recent activity
    const activity = [
      ...recentProjects.map((p) => ({
        type: "project" as const,
        action: "New project created",
        title: p.title,
        time: p.createdAt.toISOString(),
      })),
      ...recentPosts.map((p) => ({
        type: "post" as const,
        action: "New post created",
        title: p.title,
        time: p.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5); // Keep only top 5 recent items

    return NextResponse.json({
      stats: {
        totalProjects,
        totalPosts,
        publishedPosts,
        totalViews,
        avgReadingTime: avgReadingTimeResult._avg.readingTime || 0,
      },
      recentActivity: activity,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
