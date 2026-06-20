import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/contact/[id] — update a contact submission.
 * Body: { read?: boolean, archived?: boolean, notes?: string }
 *
 * DELETE /api/admin/contact/[id] — hard-delete a submission.
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
    const data: {
      read?: boolean;
      archived?: boolean;
      notes?: string;
      repliedAt?: Date | null;
    } = {};

    if (typeof body.read === "boolean") {
      data.read = body.read;
      // Marking as read for the first time — keep it simple.
    }
    if (typeof body.archived === "boolean") data.archived = body.archived;
    if (typeof body.notes === "string") data.notes = body.notes;
    if (body.repliedAt === null || typeof body.repliedAt === "string") {
      data.repliedAt =
        body.repliedAt === null ? null : new Date(body.repliedAt);
    }

    const updated = await prisma.contactSubmission.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[admin/contact] PATCH failed", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 },
    );
  }
}

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

    await prisma.contactSubmission.delete({ where: { id } });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[admin/contact] DELETE failed", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 },
    );
  }
}
