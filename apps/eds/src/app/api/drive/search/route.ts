import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ecosystem/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const [folders, files] = await Promise.all([
      prisma.eDSFolder.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.eDSFile.findMany({
        where: {
          OR: [{ name: { contains: query, mode: "insensitive" } }],
        },
        include: {
          folder: true,
        },
        take: 5,
        orderBy: { uploadedAt: "desc" },
      }),
    ]);

    console.log(
      `Search '${query}': Found ${folders.length} folders, ${files.length} files`,
    );

    const results = [
      ...folders.map((f) => ({ type: "FOLDER", data: f })),
      ...files.map((f) => ({
        type: "FILE",
        data: {
          ...f,
          size: f.size.toString(), // Convert BigInt to string
        },
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search drive" },
      { status: 500 },
    );
  }
}
