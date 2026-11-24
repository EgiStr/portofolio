import { Prisma, prisma, type CvVersion } from "@ecosystem/database";
import { atsCheck, type AtsReport } from "./ats";
import { CvContentSchema, CvStyleSchema, type CvContent } from "./schema";
import { slugify } from "./text";
import {
  certificationItem,
  experienceEntry,
  projectEntry,
  skillItems,
} from "./from-website";

/**
 * Server-only reads and writes of cv_versions. The manager editor and the MCP
 * endpoint both go through here, so they share one set of rules: content is
 * validated, the ATS score is recomputed on every write, a save only lands if
 * nobody else saved since the caller's read, and only one version is primary.
 */

export class CvStoreError extends Error {}

export interface SavedVersion {
  row: CvVersion;
  ats: AtsReport;
}

export function parseContent(raw: unknown): CvContent {
  const parsed = CvContentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const where = parsed.error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join(".")}: ${i.message}`);
  throw new CvStoreError(`Invalid content: ${where.join("; ")}`);
}

/** One version by slug, or the primary one when slug is omitted. */
export async function findVersion(slug?: string | null) {
  return slug
    ? prisma.cvVersion.findUnique({ where: { slug } })
    : prisma.cvVersion.findFirst({
        where: { isPrimary: true },
        orderBy: { updatedAt: "desc" },
      });
}

export async function listVersions() {
  return prisma.cvVersion.findMany({
    include: {
      application: {
        select: { id: true, company: true, role: true, stage: true },
      },
    },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
  });
}

async function uniqueSlug(base: string) {
  const root = slugify(base).slice(0, 60) || "cv";
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    if (
      !(await prisma.cvVersion.findUnique({
        where: { slug },
        select: { id: true },
      }))
    )
      return slug;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export interface CreateInput {
  title: string;
  targetRole?: string | null;
  company?: string | null;
  jobDescription?: string | null;
  /** Copy content and style from this version; the primary one by default. */
  baseSlug?: string | null;
  /** Start from this content instead of copying a base. */
  content?: unknown;
  isPublic?: boolean;
  /** Job application this version is tailored for. */
  applicationId?: string | null;
  createdBy: string;
}

export async function createVersion(input: CreateInput): Promise<SavedVersion> {
  let content: CvContent;
  let style: Prisma.InputJsonValue | undefined;
  if (input.content !== undefined) content = parseContent(input.content);
  else {
    const base = await findVersion(input.baseSlug);
    if (!base) throw new CvStoreError("Base CV version not found.");
    content = parseContent(base.content);
    style = (base.style ?? undefined) as Prisma.InputJsonValue | undefined;
  }
  const ats = atsCheck(content, input.jobDescription);
  const row = await prisma.cvVersion.create({
    data: {
      slug: await uniqueSlug(
        [input.company, input.targetRole || input.title]
          .filter(Boolean)
          .join(" "),
      ),
      title: input.title,
      kind: "TAILORED",
      targetRole: input.targetRole || null,
      company: input.company || null,
      jobDescription: input.jobDescription || null,
      content: content as unknown as Prisma.InputJsonValue,
      style,
      atsScore: ats.score,
      isPublic: input.isPublic ?? false,
      applicationId: input.applicationId || null,
      createdBy: input.createdBy,
    },
  });
  return { row, ats };
}

export interface UpdatePatch {
  title?: string;
  targetRole?: string | null;
  company?: string | null;
  jobDescription?: string | null;
  content?: unknown;
  style?: unknown;
  isPublic?: boolean;
  isPrimary?: boolean;
  brainNotePath?: string | null;
}

/**
 * Save changes only if the row still has the updatedAt the caller read.
 * Throws CvStoreError with the current timestamp when someone saved in between.
 */
export async function updateVersion(
  slug: string,
  expectedUpdatedAt: string | Date,
  patch: UpdatePatch,
): Promise<SavedVersion> {
  const row = await prisma.cvVersion.findUnique({ where: { slug } });
  if (!row) throw new CvStoreError(`No CV version "${slug}".`);
  const stale = () =>
    new CvStoreError(
      `This version was saved elsewhere since you opened it (now ${row.updatedAt.toISOString()}). Reload it first.`,
    );
  if (row.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime())
    throw stale();

  const { content: rawContent, style: rawStyle, ...fields } = patch;
  const content =
    rawContent === undefined ? undefined : parseContent(rawContent);
  let style: Prisma.InputJsonValue | undefined;
  if (rawStyle !== undefined) {
    const parsed = CvStyleSchema.safeParse(rawStyle);
    if (!parsed.success)
      throw new CvStoreError(
        `Invalid style: ${parsed.error.issues[0]?.message}`,
      );
    style = parsed.data as Prisma.InputJsonValue;
  }
  if (fields.isPrimary === false && row.isPrimary) {
    throw new CvStoreError(
      "Make another version primary instead of unsetting this one.",
    );
  }

  const jd =
    fields.jobDescription === undefined
      ? row.jobDescription
      : fields.jobDescription;
  const ats = atsCheck(content ?? parseContent(row.content), jd);

  const updated = await prisma.$transaction(async (tx) => {
    // Compare-and-set on updatedAt closes the gap between the check above and this write.
    const res = await tx.cvVersion.updateMany({
      where: { id: row.id, updatedAt: row.updatedAt },
      data: {
        ...fields,
        ...(fields.isPrimary ? { isPublic: true } : {}),
        ...(content
          ? { content: content as unknown as Prisma.InputJsonValue }
          : {}),
        ...(style ? { style } : {}),
        atsScore: ats.score,
      },
    });
    if (res.count === 0) return null;
    if (fields.isPrimary) {
      await tx.cvVersion.updateMany({
        where: { isPrimary: true, NOT: { id: row.id } },
        data: { isPrimary: false },
      });
    }
    return tx.cvVersion.findUnique({ where: { id: row.id } });
  });
  if (!updated) throw stale();
  return { row: updated, ats };
}

export async function deleteVersion(slug: string) {
  const row = await prisma.cvVersion.findUnique({
    where: { slug },
    select: { id: true, isPrimary: true },
  });
  if (!row) throw new CvStoreError(`No CV version "${slug}".`);
  if (row.isPrimary)
    throw new CvStoreError(
      "The primary CV cannot be deleted. Make another version primary first.",
    );
  await prisma.cvVersion.delete({ where: { id: row.id } });
}

/**
 * The website's own records (same tables as www.eggisatria.my.id), already
 * shaped as CV entries. Editors and agents pick from these instead of typing
 * facts again, so the CV and the site cannot drift apart.
 */
export async function profileData() {
  const [experiences, projects, certifications, skills] = await Promise.all([
    prisma.experience.findMany({
      orderBy: [{ order: "asc" }, { startDate: "desc" }],
    }),
    prisma.project.findMany({
      where: { status: "PUBLISHED" },
      include: { techStack: { select: { name: true } } },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.certification.findMany({
      orderBy: [{ displayOrder: "asc" }, { issueDate: "desc" }],
    }),
    prisma.skill.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] }),
  ]);
  return {
    experience: experiences.map(experienceEntry),
    projects: projects.map(projectEntry),
    certifications: certifications.map(certificationItem),
    skills: skillItems(skills),
  };
}
