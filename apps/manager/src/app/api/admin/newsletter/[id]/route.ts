import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/admin/newsletter/[id] — remove a subscriber.
 * Hard delete (not soft) so the email is gone from the list.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.newsletterSubscriber.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[admin/newsletter] DELETE failed", error);
    return NextResponse.json(
      { error: "Failed to delete subscriber" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/newsletter/[id] — update a subscriber.
 * Currently supports marking an unsubscribed row as active again.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    if (action === "reactivate") {
      const updated = await prisma.newsletterSubscriber.update({
        where: { id },
        data: { unsubscribedAt: null },
        select: {
          id: true,
          email: true,
          unsubscribedAt: true,
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[admin/newsletter] PATCH failed", error);
    return NextResponse.json(
      { error: "Failed to update subscriber" },
      { status: 500 },
    );
  }
}
