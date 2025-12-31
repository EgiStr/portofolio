import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";

// GET /api/admin/stats/analytics - Get detailed analytics data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch analytics data in parallel
    const [totalViews, topPosts, topProjects, avgReadingTime] =
      await Promise.all([
        prisma.blogView.count(),
        prisma.blogPost.findMany({
          where: { published: true },
          select: {
            id: true,
            title: true,
            readingTime: true,
            _count: { select: { views: true } },
          },
          orderBy: { views: { _count: "desc" } },
          take: 5,
        }),
        prisma.project.findMany({
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            title: true,
            clicks: true,
          },
          orderBy: { clicks: "desc" }, // Sort by clicks now
          take: 4,
        }),
        prisma.blogPost.aggregate({
          _avg: { readingTime: true },
          where: { published: true },
        }),
      ]);

    return NextResponse.json({
      stats: {
        totalViews,
        uniqueVisitors: Math.floor(totalViews * 0.65), // Estimate based on views
        avgReadTime: avgReadingTime._avg.readingTime || 0,
        bounceRate: 32.1, // Placeholder - needs real analytics integration
      },
      topPosts: topPosts.map((post) => ({
        title: post.title,
        views: post._count.views,
        readTime: post.readingTime,
      })),
      topProjects: topProjects.map((project) => ({
        title: project.title,
        clicks: project.clicks,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
