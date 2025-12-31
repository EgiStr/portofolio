import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ecosystem/database";

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.siteConfig.findMany();
    const settingsMap = settings.reduce(
      (acc, item) => {
        try {
          acc[item.key] = JSON.parse(item.value);
        } catch {
          acc[item.key] = item.value;
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    // Default configuration to combine with updates
    const defaultConfig = {
      // Profile
      name: "Eggi Satria",
      email: "hello@eggisatria.dev",
      bio: "Full Stack Developer passionate about building exceptional digital experiences.",
      avatar: "",
      location: "Indonesia",
      phone: "",

      // Landing Page
      heroTitle: "Hi, I'm Eggi",
      heroSubtitle: "Full Stack Developer",
      heroDescription:
        "I build things for the web. Specializing in creating exceptional digital experiences.",
      aboutTitle: "About Me",
      aboutDescription:
        "A passionate developer with experience in building modern web applications.",
      resumeUrl: "",

      // Blog
      blogTitle: "Notes",
      blogDescription:
        "Thoughts on software development, design, and technology.",
      postsPerPage: 10,
      showReadingTime: true,
      showViewCount: true,

      // Social Links
      twitter: "@eggisatria",
      github: "eggisatria",
      linkedin: "eggisatria",
      instagram: "",
      youtube: "",

      // SEO
      siteTitle: "Eggi Satria | Full Stack Developer",
      siteDescription:
        "Full Stack Developer specializing in building exceptional digital experiences.",
      siteKeywords: "developer, full stack, react, nextjs, typescript",
      ogImage: "",
      googleAnalyticsId: "",
    };

    return NextResponse.json({ ...defaultConfig, ...settingsMap });
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

    const updatePromises = Object.entries(body).map(([key, value]) => {
      // Convert value to string properly (JSON for complex objects)
      const stringValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      return prisma.siteConfig.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue },
      });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, message: "Settings updated" });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
