import { ResumeProps } from "@/types/resume";

export function generateResumeMarkdown(data: ResumeProps): string {
  const { user, experiences, projects, skills, siteConfig, polishedData } =
    data;

  const header = `# ${user.name}
**${siteConfig.role || "Software Engineer"}**
${user.email} | ${siteConfig.location || ""} 
${siteConfig.website ? `[Website](${siteConfig.website})` : ""} ${siteConfig.github ? `| [GitHub](https://github.com/${siteConfig.github})` : ""}
`;

  const experienceSection = experiences
    .map((exp) => {
      const dateRange = `${new Date(exp.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} - ${exp.current ? "Present" : exp.endDate ? new Date(exp.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}`;

      // Use polished data if available, otherwise original description
      const descriptionLines = polishedData?.[exp.id]
        ? polishedData[exp.id].map((line) => `- ${line}`).join("\n")
        : exp.description
            ?.split("\n")
            .filter((l: string) => l.trim())
            .map((l: string) => (l.startsWith("-") ? l : `- ${l}`))
            .join("\n") || "";

      return `### ${exp.company}
**${exp.position}** | ${dateRange} | ${exp.location}

${descriptionLines}
`;
    })
    .join("\n");

  const projectSection = projects
    .filter((p) => p.featured)
    .map((proj) => {
      const techStack = proj.techStack?.map((t: any) => t.name).join(", ");
      return `### ${proj.title} ${proj.liveUrl ? `[Live](${proj.liveUrl})` : ""}
${proj.description}
*Stack: ${techStack}*
`;
    })
    .join("\n");

  const skillsSection =
    skills.length > 0
      ? `### Skills
${skills.map((s) => s.name).join(", ")}`
      : "";

  return `${header}
---
## Experience
${experienceSection}
---
## Projects
${projectSection}
---
${skillsSection}
`;
}
