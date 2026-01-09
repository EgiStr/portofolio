import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      prisma.eDSActivityLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.eDSActivityLog.count(),
    ]);

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get activity error:", error);
    return NextResponse.json(
      { error: "Failed to get activity logs" },
      { status: 500 },
    );
  }
}

// DELETE: Clear all activity logs
export async function DELETE() {
  try {
    await prisma.eDSActivityLog.deleteMany({});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear activity error:", error);
    return NextResponse.json(
      { error: "Failed to clear activity logs" },
      { status: 500 },
    );
  }
}
