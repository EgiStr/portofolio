import { getSettings } from "@ecosystem/config";
import { prisma } from "@ecosystem/database";
import { AboutClient } from "./about.client";

async function getSkills(): Promise<string[]> {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { order: "asc" },
      take: 8,
    });
    return skills.map((s) => s.name);
  } catch (error) {
    console.error("[About] failed to fetch skills:", error);
    return [];
  }
}

export async function About() {
  const settings = await getSettings();
  const skills = await getSkills();

  return (
    <AboutClient
      title={settings.aboutTitle}
      description={settings.aboutDescription}
      skills={skills}
      profileImage="/eggisatria.png"
      resumeUrl={settings.resumeUrl}
    />
  );
}
