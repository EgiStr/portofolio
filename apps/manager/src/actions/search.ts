"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@ecosystem/database";
import { authOptions } from "@/lib/auth";

export type SearchHit = {
  kind: string;
  title: string;
  hint?: string | null;
  href: string;
};

/** Records for the command palette: titles only, five per kind. */
export async function searchRecords(q: string): Promise<SearchHit[]> {
  if (!(await getServerSession(authOptions))) return [];
  const term = q.trim();
  if (term.length < 2) return [];
  const has = { contains: term, mode: "insensitive" as const };
  const take = 5;

  const [posts, projects, roles, certs, skills, cvs, apps] = await Promise.all([
    prisma.blogPost.findMany({
      where: { title: has },
      select: { id: true, title: true, published: true },
      take,
    }),
    prisma.project.findMany({
      where: { title: has },
      select: { id: true, title: true, status: true },
      take,
    }),
    prisma.experience.findMany({
      where: { OR: [{ company: has }, { position: has }] },
      select: { id: true, company: true, position: true },
      take,
    }),
    prisma.certification.findMany({
      where: { name: has },
      select: { id: true, name: true, organization: true },
      take,
    }),
    prisma.skill.findMany({
      where: { name: has },
      select: { id: true, name: true },
      take,
    }),
    prisma.cvVersion.findMany({
      where: { title: has },
      select: { slug: true, title: true },
      take,
    }),
    prisma.jobApplication.findMany({
      where: { OR: [{ company: has }, { role: has }] },
      select: { id: true, company: true, role: true, stage: true },
      take,
    }),
  ]);

  return [
    ...posts.map((p) => ({
      kind: "Post",
      title: p.title,
      hint: p.published ? "Published" : "Draft",
      href: `/dashboard/posts/${p.id}/edit`,
    })),
    ...projects.map((p) => ({
      kind: "Project",
      title: p.title,
      hint: p.status.toLowerCase(),
      href: `/dashboard/projects/${p.id}/edit`,
    })),
    ...roles.map((r) => ({
      kind: "Experience",
      title: `${r.position}, ${r.company}`,
      href: `/dashboard/experiences/${r.id}/edit`,
    })),
    ...certs.map((c) => ({
      kind: "Certification",
      title: c.name,
      hint: c.organization,
      href: `/dashboard/certifications/${c.id}/edit`,
    })),
    ...skills.map((s) => ({
      kind: "Skill",
      title: s.name,
      href: `/dashboard/skills/${s.id}/edit`,
    })),
    ...cvs.map((c) => ({
      kind: "CV",
      title: c.title,
      href: `/dashboard/cv/${c.slug}`,
    })),
    ...apps.map((a) => ({
      kind: "Application",
      title: `${a.role} at ${a.company}`,
      hint: a.stage.toLowerCase(),
      href: `/dashboard/applications/${a.id}`,
    })),
  ];
}
