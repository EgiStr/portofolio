import { Prisma, prisma, type CoverLetter } from "@ecosystem/database";
import { CvStoreError, findVersion, parseContent } from "./store";
import {
  LetterContentSchema,
  LetterStyleSchema,
  blankLetter,
  type LetterContent,
} from "./letter";
import { letterCheck, type LetterReport } from "./letter-check";
import { slugify } from "./text";

/**
 * Server-only reads and writes of cover_letters. Same rules as the CV store:
 * content is validated, a save only lands if nobody saved since the caller's
 * read, and the manager and the MCP endpoint share this one path.
 */

export interface SavedLetter {
  row: CoverLetter;
  report: LetterReport;
}

export function parseLetter(raw: unknown): LetterContent {
  const parsed = LetterContentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const where = parsed.error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join(".")}: ${i.message}`);
  throw new CvStoreError(`Invalid letter: ${where.join("; ")}`);
}

export async function findLetter(slug: string) {
  return prisma.coverLetter.findUnique({ where: { slug } });
}

export async function listLetters(applicationId?: string | null) {
  return prisma.coverLetter.findMany({
    where: applicationId ? { applicationId } : undefined,
    include: {
      application: { select: { id: true, company: true, role: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function uniqueSlug(base: string) {
  const root = slugify(base).slice(0, 60) || "letter";
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    if (
      !(await prisma.coverLetter.findUnique({
        where: { slug },
        select: { id: true },
      }))
    )
      return slug;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export interface CreateLetterInput {
  title?: string;
  company?: string | null;
  targetRole?: string | null;
  /** Start from this content; otherwise a blank letter from the primary CV header. */
  content?: unknown;
  /** Take the sender from this CV version instead of the primary one. */
  cvSlug?: string | null;
  applicationId?: string | null;
  isPublic?: boolean;
  createdBy: string;
}

export async function createLetter(
  input: CreateLetterInput,
): Promise<SavedLetter> {
  let company = input.company ?? null;
  let role = input.targetRole ?? null;
  if (input.applicationId) {
    const app = await prisma.jobApplication.findUnique({
      where: { id: input.applicationId },
      select: { company: true, role: true },
    });
    if (!app) throw new CvStoreError("Application not found.");
    company ??= app.company;
    role ??= app.role;
  }

  let content: LetterContent;
  if (input.content !== undefined) content = parseLetter(input.content);
  else {
    if (!company)
      throw new CvStoreError("Give a company, or an application, to address.");
    const cv = await findVersion(input.cvSlug);
    if (!cv) throw new CvStoreError("No CV to take the sender from.");
    content = blankLetter(parseContent(cv.content).header, company, role);
  }
  company ??= content.recipient.company;

  const title =
    input.title?.trim() ||
    `Cover letter, ${role ?? "application"} at ${company}`;
  const row = await prisma.coverLetter.create({
    data: {
      slug: await uniqueSlug(`letter ${company} ${role ?? ""}`),
      title,
      company,
      targetRole: role,
      content: content as unknown as Prisma.InputJsonValue,
      isPublic: input.isPublic ?? false,
      applicationId: input.applicationId ?? null,
      createdBy: input.createdBy,
    },
  });
  return { row, report: letterCheck(content) };
}

export interface UpdateLetterPatch {
  title?: string;
  company?: string | null;
  targetRole?: string | null;
  content?: unknown;
  style?: unknown;
  isPublic?: boolean;
  applicationId?: string | null;
}

/** Save only if the row still has the updatedAt the caller read. */
export async function updateLetter(
  slug: string,
  expectedUpdatedAt: string | Date,
  patch: UpdateLetterPatch,
): Promise<SavedLetter> {
  const row = await prisma.coverLetter.findUnique({ where: { slug } });
  if (!row) throw new CvStoreError(`No cover letter "${slug}".`);
  const stale = () =>
    new CvStoreError(
      `This letter was saved elsewhere since you opened it (now ${row.updatedAt.toISOString()}). Reload it first.`,
    );
  if (row.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime())
    throw stale();

  const { content: rawContent, style: rawStyle, ...fields } = patch;
  const content =
    rawContent === undefined ? undefined : parseLetter(rawContent);
  let style: Prisma.InputJsonValue | undefined;
  if (rawStyle !== undefined) {
    const parsed = LetterStyleSchema.safeParse(rawStyle);
    if (!parsed.success)
      throw new CvStoreError(
        `Invalid style: ${parsed.error.issues[0]?.message}`,
      );
    style = parsed.data as Prisma.InputJsonValue;
  }
  if (fields.applicationId) {
    const app = await prisma.jobApplication.findUnique({
      where: { id: fields.applicationId },
      select: { id: true },
    });
    if (!app) throw new CvStoreError("Application not found.");
  }

  const res = await prisma.coverLetter.updateMany({
    // Compare-and-set on updatedAt closes the gap between the check above and this write.
    where: { id: row.id, updatedAt: row.updatedAt },
    data: {
      ...fields,
      ...(content
        ? { content: content as unknown as Prisma.InputJsonValue }
        : {}),
      ...(style ? { style } : {}),
    },
  });
  if (res.count === 0) throw stale();
  const updated = await prisma.coverLetter.findUniqueOrThrow({
    where: { id: row.id },
  });
  return {
    row: updated,
    report: letterCheck(content ?? parseLetter(updated.content)),
  };
}

export async function deleteLetter(slug: string) {
  const row = await prisma.coverLetter.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!row) throw new CvStoreError(`No cover letter "${slug}".`);
  await prisma.coverLetter.delete({ where: { id: row.id } });
}
