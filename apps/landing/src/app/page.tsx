import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Spotlight, GridBackground } from "@/components/ui/spotlight";
import { prisma } from "@ecosystem/database";

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
import { Newsletter } from "@/components/sections/newsletter";

export const revalidate = 60; // Revalidate every 60 seconds

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
  const [experiences, projects, certifications] = await Promise.all([
    getExperiences(),
    getProjects(),
    getCertifications(),
  ]);

  return (
    <>
      <Spotlight />
      <GridBackground />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <About />
        <Experience experiences={experiences} />
        <Projects initialProjects={projects as any} />
        <Certifications certifications={certifications as any} />
        <Newsletter />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
