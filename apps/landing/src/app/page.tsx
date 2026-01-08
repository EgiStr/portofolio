import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Spotlight, GridBackground } from "@/components/ui/spotlight";
import { prisma } from "@ecosystem/database";
import type { Metadata } from "next";

// Lazy load below-fold components to reduce initial bundle
const Experience = dynamic(
  () =>
    import("@/components/sections/experience").then((mod) => mod.Experience),
  { ssr: true },
);
const Projects = dynamic(
  () => import("@/components/sections/projects").then((mod) => mod.Projects),
  { ssr: true },
);
const Certifications = dynamic(
  () =>
    import("@/components/sections/certifications").then(
      (mod) => mod.Certifications,
    ),
  { ssr: true },
);
const Contact = dynamic(
  () => import("@/components/sections/contact").then((mod) => mod.Contact),
  { ssr: true },
);

export const revalidate = 60; // Revalidate every 60 seconds

export async function generateMetadata(): Promise<Metadata> {
  try {
    const configs = await prisma.siteConfig.findMany();
    const settings = configs.reduce(
      (acc: Record<string, any>, config: any) => {
        try {
          acc[config.key] = JSON.parse(config.value);
        } catch {
          acc[config.key] = config.value;
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    return {
      title: settings.siteName || "Eggi Satria | Full Stack Developer",
      description:
        settings.heroDescription ||
        "Full Stack Developer passionate about building exceptional digital experiences.",
    };
  } catch (error) {
    return {
      title: "Eggi Satria | Full Stack Developer",
      description:
        "Full Stack Developer passionate about building exceptional digital experiences.",
    };
  }
}

async function getSettings() {
  try {
    const configs = await prisma.siteConfig.findMany();
    return configs.reduce(
      (acc: Record<string, any>, config: any) => {
        try {
          acc[config.key] = JSON.parse(config.value);
        } catch {
          acc[config.key] = config.value;
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
    return skills.map((s: any) => s.name);
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

    return experiences.map((exp: any) => {
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
        ? exp.description
            .split("\n")
            .filter((line: any) => line.trim().length > 0)
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

async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      where: { status: "PUBLISHED" },
      include: { techStack: true },
      orderBy: [
        { featured: "desc" },
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    });
    return projects;
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
}

async function getCertifications() {
  try {
    const certifications = await prisma.certification.findMany({
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });
    return certifications;
  } catch (error) {
    console.error("Failed to fetch certifications:", error);
    return [];
  }
}

export default async function Home() {
  const [settings, skills, experiences, projects, certifications] =
    await Promise.all([
      getSettings(),
      getSkills(),
      getExperiences(),
      getProjects(),
      getCertifications(),
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
        <Projects initialProjects={projects as any} />
        <Experience experiences={experiences} />
        <Certifications certifications={certifications as any} />
        <Contact
        // email={settings.email}
        // socialLinks={heroProps.socialLinks}
        />
      </main>
      <Footer />
    </>
  );
}
