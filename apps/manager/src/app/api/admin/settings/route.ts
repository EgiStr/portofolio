import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { defaultSettings } from "@ecosystem/config/defaults";
import { readRawSettings, upsertSettings } from "@ecosystem/config";

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read DB values, then layer them over the package defaults so a fresh
    // DB still returns a complete shape.
    const stored = await readRawSettings();

    return NextResponse.json({ ...defaultSettings, ...stored });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Persist via the shared helper (handles JSON encoding for complex values,
    // strips nulls/undefineds, and fans the upserts in parallel).
    await upsertSettings(body);

    // Fan out revalidation to consumer apps (landing, blog, eds, hub).
    // Dynamic-imported + wrapped in try/catch so a missing helper from
    // Builder A doesn't break the save flow — see bd-08 / bd-02.
    try {
      const { fanoutRevalidate } = await import("@/lib/revalidate-fanout");
      await fanoutRevalidate(["site-settings"]);
    } catch (err) {
      console.warn("[settings] fanout revalidation skipped:", err);
    }

    return NextResponse.json({ success: true, message: "Settings updated" });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
