import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, Prisma } from "@ecosystem/database";

/**
 * GET /api/admin/newsletter — list newsletter subscribers (paginated).
 * Query params:
 *   - page, limit (pagination)
 *   - status: "active" | "unsubscribed" | "all" (default "all")
 *   - q: substring search across email and name
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25", 10)),
    );
    const status = (searchParams.get("status") || "all").toLowerCase();
    const q = searchParams.get("q")?.trim() || "";

    const where: Prisma.NewsletterSubscriberWhereInput = {
      ...(q && {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(status === "active" && { unsubscribedAt: null }),
      ...(status === "unsubscribed" && { unsubscribedAt: { not: null } }),
    };

    const [subscribers, total, activeCount, unsubscribedCount] =
      await Promise.all([
        prisma.newsletterSubscriber.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            email: true,
            name: true,
            source: true,
            confirmedAt: true,
            unsubscribedAt: true,
            createdAt: true,
          },
        }),
        prisma.newsletterSubscriber.count({ where }),
        prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
        prisma.newsletterSubscriber.count({
          where: { unsubscribedAt: { not: null } },
        }),
      ]);

    return NextResponse.json({
      data: subscribers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      stats: {
        active: activeCount,
        unsubscribed: unsubscribedCount,
        total: activeCount + unsubscribedCount,
      },
    });
  } catch (error) {
    console.error("[admin/newsletter] GET failed", error);
    return NextResponse.json(
      { error: "Failed to load subscribers" },
      { status: 500 },
    );
  }
}
