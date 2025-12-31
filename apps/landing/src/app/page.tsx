import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Experience } from "@/components/sections/experience";
import { Projects } from "@/components/sections/projects";
import { Contact } from "@/components/sections/contact";
import { Spotlight, GridBackground } from "@/components/ui/spotlight";
import { prisma } from "@ecosystem/database";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Revalidate every 60 seconds

async function getSettings() {
  try {
    const configs = await prisma.siteConfig.findMany();
    return configs.reduce(
      (acc, config) => {
        try {
          (acc as any)[config.key] = JSON.parse(config.value);
        } catch {
          (acc as any)[config.key] = config.value;
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return {};
  }
}

async function getSkills() {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { order: "asc" },
      take: 8,
    });
    return skills.map((s) => s.name);
  } catch (error) {
    console.error("Failed to fetch skills:", error);
    return [];
  }
}

async function getExperiences() {
  try {
    const experiences = await prisma.experience.findMany({
      orderBy: { order: "asc" },
    });

    return experiences.map((exp) => {
      const startDate = new Date(exp.startDate).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const endDate = exp.current
        ? "Present"
        : exp.endDate
          ? new Date(exp.endDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })
          : "";

      const description = exp.description
        ? exp.description.split("\n").filter((line) => line.trim().length > 0)
        : [];

      return {
        id: exp.id,
        company: exp.company,
        position: exp.position,
        period: `${startDate} - ${endDate}`,
        description,
      };
    });
  } catch (error) {
    console.error("Failed to fetch experiences:", error);
    return [];
  }
}

export default async function Home() {
  const [settings, skills, experiences] = await Promise.all([
    getSettings(),
    getSkills(),
    getExperiences(),
  ]);

  const heroProps = {
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    heroDescription: settings.heroDescription,
    socialLinks: {
      github: settings.github,
      linkedin: settings.linkedin,
      twitter: settings.twitter,
      instagram: settings.instagram,
      youtube: settings.youtube,
      email: settings.email,
    },
    resumeUrl: settings.resumeUrl,
  };

  return (
    <>
      <Spotlight />
      <GridBackground />
      <Navbar />
      <main className="relative z-10">
        <Hero {...heroProps} />
        <About
          description={settings.aboutDescription}
          skills={skills}
          profileImage="/eggisatria.png"
        />
        <Experience experiences={experiences} />
        <Projects />
        <Contact
        // email={settings.email}
        // socialLinks={heroProps.socialLinks}
        />
      </main>
      <Footer />
    </>
  );
}
