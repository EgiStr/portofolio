import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

// GET: List folders (optionally filtered by parent)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");

    const folders = await prisma.eDSFolder.findMany({
      where: {
        parentId: parentId || null,
      },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { files: true, children: true } },
      },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Get folders error:", error);
    return NextResponse.json(
      { error: "Failed to get folders" },
      { status: 500 },
    );
  }
}

// POST: Create new folder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, parentId } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 },
      );
    }

    // Build path
    let path = `/${name}`;
    if (parentId) {
      const parent = await prisma.eDSFolder.findUnique({
        where: { id: parentId },
      });
      if (parent) {
        path = `${parent.path}/${name}`;
      }
    }

    // Check if folder with same name already exists in parent
    const existing = await prisma.eDSFolder.findFirst({
      where: { name, parentId: parentId || null },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A folder with this name already exists" },
        { status: 409 },
      );
    }

    const folder = await prisma.eDSFolder.create({
      data: {
        name: name.trim(),
        path,
        parentId: parentId || null,
      },
    });

    // Log activity
    await prisma.eDSActivityLog.create({
      data: {
        action: "CREATE_FOLDER",
        targetType: "FOLDER",
        targetId: folder.id,
        metadata: { name: folder.name, path: folder.path },
      },
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 },
    );
  }
}

// DELETE: Delete folder
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("id");

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 },
      );
    }

    // Check if folder has files or subfolders
    const folder = await prisma.eDSFolder.findUnique({
      where: { id: folderId },
      include: {
        _count: { select: { files: true, children: true } },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (folder._count.files > 0 || folder._count.children > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete folder with contents. Delete files and subfolders first.",
        },
        { status: 400 },
      );
    }

    await prisma.eDSFolder.delete({
      where: { id: folderId },
    });

    // Log activity
    await prisma.eDSActivityLog.create({
      data: {
        action: "DELETE_FOLDER",
        targetType: "FOLDER",
        targetId: folderId,
        metadata: { name: folder.name },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete folder error:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
}

// PATCH: Rename folder
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { folderId, name } = body;

    if (!folderId || !name) {
      return NextResponse.json(
        { error: "Folder ID and name are required" },
        { status: 400 },
      );
    }

    const folder = await prisma.eDSFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Update path
    const pathParts = folder.path.split("/");
    pathParts[pathParts.length - 1] = name;
    const newPath = pathParts.join("/");

    const updated = await prisma.eDSFolder.update({
      where: { id: folderId },
      data: {
        name: name.trim(),
        path: newPath,
      },
    });

    return NextResponse.json({ folder: updated });
  } catch (error) {
    console.error("Rename folder error:", error);
    return NextResponse.json(
      { error: "Failed to rename folder" },
      { status: 500 },
    );
  }
}
