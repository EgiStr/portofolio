import { Suspense } from "react";
import { prisma } from "@ecosystem/database";
import { ResumeBuilder } from "@/components/resume/resume-builder";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function getResumeData() {
  const [user, experiences, projects, skills, siteConfigRaw] =
    await Promise.all([
      prisma.user.findFirst(), // Assuming single user or main admin
      prisma.experience.findMany({
        orderBy: { order: "asc" },
        // fallback to date if order is 0/same? or maybe orderBy startDate desc
      }),
      prisma.project.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { displayOrder: "asc" },
        include: { techStack: true },
      }),
      prisma.skill.findMany({
        orderBy: { order: "asc" },
      }),
      prisma.siteConfig.findMany(),
    ]);

  // Sort experiences: Current first, then by endDate desc, then startDate desc
  const sortedExperiences = experiences.sort((a, b) => {
    if (a.current && !b.current) return -1;
    if (!a.current && b.current) return 1;

    // Both current or both past
    const dateA = a.endDate
      ? new Date(a.endDate).getTime()
      : new Date().getTime();
    const dateB = b.endDate
      ? new Date(b.endDate).getTime()
      : new Date().getTime();
    return dateB - dateA;
  });

  const siteConfig = siteConfigRaw.reduce(
    (acc, config) => {
      acc[config.key] = config.value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    user: user || { name: "Eggi Satria", email: "contact@eggisatria.dev" },
    experiences: sortedExperiences,
    projects,
    skills,
    siteConfig,
  };
}

export default async function ResumePage() {
  const data = await getResumeData();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resume Generator</h1>
        <p className="text-muted-foreground">
          Generate a professional resume from your portfolio data.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        }
      >
        <div className="flex-1">
          <ResumeBuilder
            user={data.user}
            experiences={data.experiences}
            projects={data.projects}
            skills={data.skills}
            siteConfig={data.siteConfig}
          />
        </div>
      </Suspense>
    </div>
  );
}
