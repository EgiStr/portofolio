import { prisma, Prisma } from "@ecosystem/database";
import { defaultSettings } from "@ecosystem/config/defaults";
import {
  readRawSettings,
  SettingsSchema,
  upsertSettings,
} from "@ecosystem/config";
import { fanoutRevalidate } from "@/lib/revalidate-fanout";

/**
 * Site content operations shared by the manager MCP (and, later, the redesigned
 * UI). Write semantics follow the /api/admin routes: reading time and
 * publishedAt for posts, tags upserted by slug, tech stack replaced as a list.
 */
export class ContentError extends Error {}

type Patch<T> = { [K in keyof T]?: T[K] | null };

const readingTime = (content: string) =>
  Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200));
const date = (v: string | null | undefined) => (v == null ? v : new Date(v));
const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

/** Drop undefined keys so a patch only touches the fields it names. */
function defined<T extends Record<string, unknown>>(o: T) {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

/** Compare-and-set: refuse when the row changed since the caller read it. */
function checkFresh(
  current: { updatedAt: Date } | null,
  expected: string,
  what: string,
) {
  if (!current) throw new ContentError(`${what} not found.`);
  if (current.updatedAt.getTime() !== new Date(expected).getTime()) {
    throw new ContentError(
      `${what} changed since your last read (now ${current.updatedAt.toISOString()}). Read it again and reapply your change.`,
    );
  }
}

/** Translate Prisma's known errors into messages an agent can act on. */
export async function wrap<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002")
        throw new ContentError(
          `Already exists: ${(e.meta?.target as string[] | undefined)?.join(", ") ?? "unique field"} must be unique.`,
        );
      if (e.code === "P2025") throw new ContentError("Record not found.");
      if (e.code === "P2003")
        throw new ContentError("A referenced record does not exist.");
    }
    throw e;
  }
}

async function ownerId() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!admin)
    throw new ContentError(
      "No ADMIN user exists to own new posts and projects.",
    );
  return admin.id;
}

// ── Posts ───────────────────────────────────────────────────────────────

export type PostInput = {
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  published?: boolean;
  tags?: string[];
};

async function tagIds(tags: string[]) {
  const rows = await Promise.all(
    tags.map((name) =>
      prisma.blogTag.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
  );
  return rows.map((t) => ({ id: t.id }));
}

export const posts = {
  list: (q?: string, published?: boolean) =>
    prisma.blogPost.findMany({
      where: {
        ...(published !== undefined && { published }),
        ...(q && {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        published: true,
        publishedAt: true,
        readingTime: true,
        updatedAt: true,
        tags: { select: { name: true } },
        _count: { select: { views: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  get: async (idOrSlug: string) => {
    const row = await prisma.blogPost.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { tags: true },
    });
    if (!row) throw new ContentError(`Post "${idOrSlug}" not found.`);
    return row;
  },
  create: async (i: PostInput) =>
    wrap(async () =>
      prisma.blogPost.create({
        data: {
          title: i.title,
          slug: i.slug,
          content: i.content,
          excerpt: i.excerpt,
          coverImage: i.coverImage,
          published: i.published ?? false,
          publishedAt: i.published ? new Date() : null,
          readingTime: readingTime(i.content),
          authorId: await ownerId(),
          tags: { connect: await tagIds(i.tags ?? []) },
        },
        include: { tags: true },
      }),
    ),
  update: async (id: string, expected: string, p: Patch<PostInput>) =>
    wrap(async () => {
      const cur = await prisma.blogPost.findUnique({ where: { id } });
      checkFresh(cur, expected, "Post");
      return prisma.blogPost.update({
        where: { id },
        data: defined({
          title: p.title ?? undefined,
          slug: p.slug ?? undefined,
          content: p.content ?? undefined,
          excerpt: p.excerpt,
          coverImage: p.coverImage,
          published: p.published ?? undefined,
          publishedAt:
            p.published && !cur!.publishedAt ? new Date() : undefined,
          readingTime: p.content ? readingTime(p.content) : undefined,
          tags: p.tags ? { set: await tagIds(p.tags) } : undefined,
        }),
        include: { tags: true },
      });
    }),
  remove: (id: string) =>
    wrap(() =>
      prisma.blogPost.delete({
        where: { id },
        select: { id: true, slug: true, title: true },
      }),
    ),
};

// ── Projects ────────────────────────────────────────────────────────────

export type ProjectInput = {
  title: string;
  slug: string;
  description: string;
  longDescription?: string | null;
  imageUrl?: string | null;
  liveUrl?: string | null;
  githubUrl?: string | null;
  featured?: boolean;
  displayOrder?: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  techStack?: string[];
};

export const projects = {
  list: () =>
    prisma.project.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        status: true,
        featured: true,
        displayOrder: true,
        clicks: true,
        updatedAt: true,
        techStack: { select: { name: true } },
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    }),
  get: async (idOrSlug: string) => {
    const row = await prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { techStack: true },
    });
    if (!row) throw new ContentError(`Project "${idOrSlug}" not found.`);
    return row;
  },
  create: async ({ techStack, ...i }: ProjectInput) =>
    wrap(async () =>
      prisma.project.create({
        data: {
          ...i,
          authorId: await ownerId(),
          techStack: { create: (techStack ?? []).map((name) => ({ name })) },
        },
        include: { techStack: true },
      }),
    ),
  update: async (
    id: string,
    expected: string,
    { techStack, ...p }: Patch<ProjectInput>,
  ) =>
    wrap(async () => {
      checkFresh(
        await prisma.project.findUnique({ where: { id } }),
        expected,
        "Project",
      );
      return prisma.$transaction(async (tx) => {
        if (techStack)
          await tx.projectTech.deleteMany({ where: { projectId: id } });
        return tx.project.update({
          where: { id },
          data: {
            ...defined({
              title: p.title ?? undefined,
              slug: p.slug ?? undefined,
              description: p.description ?? undefined,
              longDescription: p.longDescription,
              imageUrl: p.imageUrl,
              liveUrl: p.liveUrl,
              githubUrl: p.githubUrl,
              featured: p.featured ?? undefined,
              displayOrder: p.displayOrder ?? undefined,
              status: p.status ?? undefined,
            }),
            ...(techStack && {
              techStack: { create: techStack.map((name) => ({ name })) },
            }),
          },
          include: { techStack: true },
        });
      });
    }),
  remove: (id: string) =>
    wrap(() =>
      prisma.project.delete({
        where: { id },
        select: { id: true, slug: true, title: true },
      }),
    ),
};

// ── Experience ──────────────────────────────────────────────────────────

export type ExperienceInput = {
  company: string;
  position: string;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
  description?: string | null;
  location?: string | null;
  companyUrl?: string | null;
  companyLogo?: string | null;
  order?: number;
};

export const experiences = {
  list: () =>
    prisma.experience.findMany({
      orderBy: [{ order: "asc" }, { startDate: "desc" }],
    }),
  create: (i: ExperienceInput) =>
    wrap(() =>
      prisma.experience.create({
        data: {
          ...i,
          startDate: new Date(i.startDate),
          endDate: date(i.endDate),
        },
      }),
    ),
  update: async (id: string, expected: string, p: Patch<ExperienceInput>) =>
    wrap(async () => {
      checkFresh(
        await prisma.experience.findUnique({ where: { id } }),
        expected,
        "Experience",
      );
      return prisma.experience.update({
        where: { id },
        data: defined({
          company: p.company ?? undefined,
          position: p.position ?? undefined,
          startDate: p.startDate ? new Date(p.startDate) : undefined,
          endDate: date(p.endDate),
          current: p.current ?? undefined,
          description: p.description,
          location: p.location,
          companyUrl: p.companyUrl,
          companyLogo: p.companyLogo,
          order: p.order ?? undefined,
        }),
      });
    }),
  remove: (id: string) =>
    wrap(() =>
      prisma.experience.delete({
        where: { id },
        select: { id: true, company: true, position: true },
      }),
    ),
};

// ── Skills (no updatedAt column, so no compare-and-set) ─────────────────

export type SkillInput = {
  name: string;
  category?:
    | "LANGUAGE"
    | "FRAMEWORK"
    | "DATABASE"
    | "DEVOPS"
    | "TOOL"
    | "OTHER";
  level?: number;
  icon?: string | null;
  order?: number;
};

export const skills = {
  list: () =>
    prisma.skill.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
    }),
  create: (i: SkillInput) => wrap(() => prisma.skill.create({ data: i })),
  update: (id: string, p: Patch<SkillInput>) =>
    wrap(() =>
      prisma.skill.update({
        where: { id },
        data: defined({
          name: p.name ?? undefined,
          category: p.category ?? undefined,
          level: p.level ?? undefined,
          icon: p.icon,
          order: p.order ?? undefined,
        }),
      }),
    ),
  remove: (id: string) =>
    wrap(() =>
      prisma.skill.delete({ where: { id }, select: { id: true, name: true } }),
    ),
};

// ── Certifications ──────────────────────────────────────────────────────

export type CertificationInput = {
  name: string;
  organization: string;
  issueDate: string;
  credentialId?: string | null;
  verificationUrl?: string | null;
  organizationLogo?: string | null;
  certificateFile?: string | null;
  displayOrder?: number;
  skillIds?: string[];
  category?:
    | "MACHINE_LEARNING"
    | "CLOUD_COMPUTING"
    | "DATA_ANALYTICS"
    | "WEB_DEVELOPMENT"
    | "MOBILE_DEVELOPMENT"
    | "DEVOPS"
    | "CYBERSECURITY"
    | "DATABASE"
    | "OTHER";
};

const certInclude = {
  skills: { select: { skill: { select: { id: true, name: true } } } },
} as const;

export const certifications = {
  list: () =>
    prisma.certification.findMany({
      include: certInclude,
      orderBy: [{ displayOrder: "asc" }, { issueDate: "desc" }],
    }),
  create: ({ skillIds, ...i }: CertificationInput) =>
    wrap(() =>
      prisma.certification.create({
        data: {
          ...i,
          issueDate: new Date(i.issueDate),
          skills: { create: (skillIds ?? []).map((skillId) => ({ skillId })) },
        },
        include: certInclude,
      }),
    ),
  update: async (
    id: string,
    expected: string,
    { skillIds, ...p }: Patch<CertificationInput>,
  ) =>
    wrap(async () => {
      checkFresh(
        await prisma.certification.findUnique({ where: { id } }),
        expected,
        "Certification",
      );
      return prisma.$transaction(async (tx) => {
        // Skills are replaced only when the caller sends a list.
        if (skillIds)
          await tx.certificationSkill.deleteMany({
            where: { certificationId: id },
          });
        return tx.certification.update({
          where: { id },
          data: {
            ...defined({
              name: p.name ?? undefined,
              organization: p.organization ?? undefined,
              issueDate: p.issueDate ? new Date(p.issueDate) : undefined,
              credentialId: p.credentialId,
              verificationUrl: p.verificationUrl,
              organizationLogo: p.organizationLogo,
              certificateFile: p.certificateFile,
              category: p.category ?? undefined,
              displayOrder: p.displayOrder ?? undefined,
            }),
            ...(skillIds && {
              skills: { create: skillIds.map((skillId) => ({ skillId })) },
            }),
          },
          include: certInclude,
        });
      });
    }),
  remove: (id: string) =>
    wrap(() =>
      prisma.certification.delete({
        where: { id },
        select: { id: true, name: true },
      }),
    ),
};

// ── Settings ────────────────────────────────────────────────────────────

export const settings = {
  get: async () => ({ ...defaultSettings, ...(await readRawSettings()) }),
  /** Validates keys and values against SettingsSchema, saves, then refreshes every app's settings cache. */
  update: async (patch: Record<string, unknown>) => {
    const parsed = SettingsSchema.partial().strict().safeParse(patch);
    if (!parsed.success)
      throw new ContentError(
        parsed.error.issues
          .map((i) => `${i.path.join(".") || "settings"}: ${i.message}`)
          .join("; "),
      );
    // .partial() still fills defaults, so keep only the keys the caller sent.
    const values = Object.fromEntries(
      Object.keys(patch).map((k) => [
        k,
        (parsed.data as Record<string, unknown>)[k],
      ]),
    );
    await upsertSettings(values);
    const fanout = await fanoutRevalidate(["site-settings"]).catch(() => []);
    return {
      saved: Object.keys(values),
      revalidated: fanout.filter((f) => f.ok).map((f) => f.target),
    };
  },
};
