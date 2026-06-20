import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, Prisma } from "@ecosystem/database";

/**
 * GET /api/admin/contact — list contact form submissions (paginated).
 * Query params:
 *   - page, limit (pagination)
 *   - read: "true" | "false" | "all" (default "all")
 *   - archived: "true" | "false" | "all" (default "all")
 *   - q: substring search across name, email, message
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
    const readFilter = (searchParams.get("read") || "all").toLowerCase();
    const archivedFilter = (
      searchParams.get("archived") || "all"
    ).toLowerCase();
    const q = searchParams.get("q")?.trim() || "";

    const where: Prisma.ContactSubmissionWhereInput = {
      ...(readFilter === "true" && { read: true }),
      ...(readFilter === "false" && { read: false }),
      ...(archivedFilter === "true" && { archived: true }),
      ...(archivedFilter === "false" && { archived: false }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { message: { contains: q, mode: "insensitive" } },
        ],
      }),
    };

    const [submissions, total, unread] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactSubmission.count({ where }),
      prisma.contactSubmission.count({
        where: { read: false, archived: false },
      }),
    ]);

    return NextResponse.json({
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      stats: {
        unread,
        total,
      },
    });
  } catch (error) {
    console.error("[admin/contact] GET failed", error);
    return NextResponse.json(
      { error: "Failed to load submissions" },
      { status: 500 },
    );
  }
}
