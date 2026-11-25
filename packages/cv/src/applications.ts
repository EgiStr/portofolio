import { prisma, type JobApplication } from "@ecosystem/database";
import { brainConfigured, logApplication } from "./brain";
import { createVersion, CvStoreError, findVersion } from "./store";
import {
  appliedAtAfterMove,
  isStage,
  stageEventTitle,
  STAGE_LABEL,
  type EventKind,
  type Stage,
} from "./stages";

/**
 * Server-only reads and writes of job applications. The manager tracker and
 * the MCP endpoint both go through here. Each application owns the CV
 * versions tailored for it and records which one was sent; every stage
 * change is written to its timeline in the same transaction.
 */

const CV_URL = () =>
  process.env.NEXT_PUBLIC_CV_URL || "https://cv.eggisatria.my.id";

export interface ApplicationFields {
  company?: string;
  role?: string;
  location?: string | null;
  jobUrl?: string | null;
  source?: string | null;
  jobDescription?: string | null;
  appliedAt?: string | Date | null;
  followUpAt?: string | Date | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactUrl?: string | null;
  salaryExpected?: string | null;
  salaryOffer?: string | null;
  notes?: string | null;
}

const TEXT_FIELDS = [
  "company",
  "role",
  "location",
  "jobUrl",
  "source",
  "jobDescription",
  "contactName",
  "contactEmail",
  "contactUrl",
  "salaryExpected",
  "salaryOffer",
  "notes",
] as const;

/** Trim text, turn empty strings into null, parse dates. Leaves out keys the caller did not send. */
function clean(f: ApplicationFields) {
  const out: Record<string, string | Date | null> = {};
  for (const k of TEXT_FIELDS) {
    if (f[k] === undefined) continue;
    const v = typeof f[k] === "string" ? (f[k] as string).trim() : null;
    out[k] = v ? v : null;
  }
  for (const k of ["appliedAt", "followUpAt"] as const) {
    if (f[k] === undefined) continue;
    const v = f[k] ? new Date(f[k] as string | Date) : null;
    if (v && Number.isNaN(v.getTime()))
      throw new CvStoreError(`Invalid date for ${k}.`);
    out[k] = v;
  }
  if (out.company === null || out.role === null)
    throw new CvStoreError("Company and role are required.");
  return out;
}

function stageOf(s: unknown): Stage {
  if (!isStage(s)) throw new CvStoreError(`Unknown stage "${String(s)}".`);
  return s;
}

const versionSelect = {
  id: true,
  slug: true,
  title: true,
  atsScore: true,
  isPublic: true,
  isPrimary: true,
  jobDescription: true,
  updatedAt: true,
} as const;

const letterSelect = {
  slug: true,
  title: true,
  isPublic: true,
  updatedAt: true,
} as const;

const documentSelect = {
  id: true,
  kind: true,
  title: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
} as const;

export async function listApplications() {
  return prisma.jobApplication.findMany({
    include: {
      versions: { select: versionSelect, orderBy: { updatedAt: "desc" } },
      sentCv: { select: { slug: true, title: true, atsScore: true } },
      events: {
        orderBy: { at: "desc" },
        take: 1,
        select: { title: true, at: true, kind: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getApplication(id: string) {
  const app = await prisma.jobApplication.findUnique({
    where: { id },
    include: {
      versions: { select: versionSelect, orderBy: { updatedAt: "desc" } },
      sentCv: { select: versionSelect },
      letters: { select: letterSelect, orderBy: { updatedAt: "desc" } },
      documents: {
        select: { document: { select: documentSelect } },
        orderBy: { createdAt: "asc" },
      },
      events: { orderBy: [{ at: "desc" }, { createdAt: "desc" }] },
    },
  });
  if (!app) throw new CvStoreError("Application not found.");
  return app;
}

export type ApplicationDetail = Awaited<ReturnType<typeof getApplication>>;

export interface CreateApplicationInput extends ApplicationFields {
  company: string;
  role: string;
  stage?: Stage;
  /** Also create a tailored CV version, copied from this base (the primary CV when null). */
  createCv?: boolean;
  cvBaseSlug?: string | null;
  createdBy: string;
}

export async function createApplication(input: CreateApplicationInput) {
  const { createCv, cvBaseSlug, createdBy, stage: rawStage, ...fields } = input;
  const data = clean(fields);
  const stage = rawStage ? stageOf(rawStage) : "WISHLIST";
  const appliedAt =
    (data.appliedAt as Date | null | undefined) ??
    appliedAtAfterMove(null, stage);
  const app = await prisma.jobApplication.create({
    data: {
      ...(data as { company: string; role: string }),
      stage,
      appliedAt,
      createdBy,
      events: {
        create: { kind: "stage", stage, title: stageEventTitle(null, stage) },
      },
    },
  });
  if (createCv) await createVersionFor(app.id, cvBaseSlug, createdBy);
  return app;
}

/**
 * Save field edits only if nobody saved since the caller's read (same rule as
 * CV versions). A stage in the patch is applied like moveStage.
 */
export async function updateApplication(
  id: string,
  expectedUpdatedAt: string | Date,
  patch: ApplicationFields & { stage?: Stage },
) {
  const row = await prisma.jobApplication.findUnique({ where: { id } });
  if (!row) throw new CvStoreError("Application not found.");
  const stale = () =>
    new CvStoreError(
      "This application was changed elsewhere since you opened it. Reload it first.",
    );
  if (row.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime())
    throw stale();

  const { stage: rawStage, ...fields } = patch;
  const data = clean(fields);
  const stage = rawStage === undefined ? row.stage : stageOf(rawStage);
  const moved = stage !== row.stage;
  if (moved && data.appliedAt === undefined)
    data.appliedAt = appliedAtAfterMove(row.appliedAt, stage);

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.jobApplication.updateMany({
      where: { id, updatedAt: row.updatedAt },
      data: { ...data, stage },
    });
    if (res.count === 0) return null;
    if (moved)
      await tx.jobApplicationEvent.create({
        data: {
          applicationId: id,
          kind: "stage",
          stage,
          title: stageEventTitle(row.stage, stage),
        },
      });
    return tx.jobApplication.findUnique({ where: { id } });
  });
  if (!updated) throw stale();
  return { row: updated, moved };
}

/** Board move. No version check: it changes one field and always adds a timeline entry. */
export async function moveStage(id: string, to: Stage, note?: string | null) {
  const stage = stageOf(to);
  const row = await prisma.jobApplication.findUnique({ where: { id } });
  if (!row) throw new CvStoreError("Application not found.");
  if (row.stage === stage) return { row, moved: false };
  const [updated] = await prisma.$transaction([
    prisma.jobApplication.update({
      where: { id },
      data: { stage, appliedAt: appliedAtAfterMove(row.appliedAt, stage) },
    }),
    prisma.jobApplicationEvent.create({
      data: {
        applicationId: id,
        kind: "stage",
        stage,
        title: stageEventTitle(row.stage, stage),
        notes: note?.trim() || null,
      },
    }),
  ]);
  return { row: updated, moved: true };
}

export interface EventInput {
  kind: EventKind;
  title: string;
  at?: string | Date | null;
  notes?: string | null;
}

/** Timeline entry (interview round, test, note). Does not change the application's version stamp. */
export async function addEvent(applicationId: string, e: EventInput) {
  if (!e.title.trim()) throw new CvStoreError("Give the event a title.");
  const at = e.at ? new Date(e.at) : new Date();
  if (Number.isNaN(at.getTime())) throw new CvStoreError("Invalid event date.");
  return prisma.jobApplicationEvent.create({
    data: {
      applicationId,
      kind: e.kind,
      title: e.title.trim().slice(0, 200),
      at,
      notes: e.notes?.trim() || null,
    },
  });
}

export async function deleteEvent(applicationId: string, eventId: string) {
  const res = await prisma.jobApplicationEvent.deleteMany({
    where: { id: eventId, applicationId },
  });
  if (res.count === 0) throw new CvStoreError("Event not found.");
}

/** Deletes the application and its timeline. Its CV versions stay, unlinked. */
export async function deleteApplication(id: string) {
  await prisma.jobApplication.delete({ where: { id } });
}

/** New tailored CV version for this application, with its company, role and job description. */
export async function createVersionFor(
  applicationId: string,
  baseSlug: string | null | undefined,
  createdBy: string,
) {
  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) throw new CvStoreError("Application not found.");
  const count = await prisma.cvVersion.count({ where: { applicationId } });
  const { row } = await createVersion({
    title: `${app.role} at ${app.company}${count ? ` v${count + 1}` : ""}`,
    company: app.company,
    targetRole: app.role,
    jobDescription: app.jobDescription,
    baseSlug,
    applicationId,
    createdBy,
  });
  return row;
}

/** Attach an existing version to an application, or detach it (applicationId null). */
export async function linkVersion(slug: string, applicationId: string | null) {
  const v = await findVersion(slug);
  if (!v) throw new CvStoreError(`No CV version "${slug}".`);
  if (v.isPrimary && applicationId)
    throw new CvStoreError(
      "The primary CV is shared by all applications. Mark it as sent instead of linking it.",
    );
  await prisma.cvVersion.update({
    where: { id: v.id },
    data: { applicationId },
  });
}

/** Record which CV went out (any version, the primary one included), or clear it. */
export async function setSentCv(applicationId: string, slug: string | null) {
  const v = slug ? await findVersion(slug) : null;
  if (slug && !v) throw new CvStoreError(`No CV version "${slug}".`);
  const [row] = await prisma.$transaction([
    prisma.jobApplication.update({
      where: { id: applicationId },
      data: { sentCvId: v?.id ?? null },
    }),
    ...(v
      ? [
          prisma.jobApplicationEvent.create({
            data: { applicationId, kind: "note", title: `Sent CV: ${v.title}` },
          }),
        ]
      : []),
  ]);
  return row;
}

/**
 * The application a CV version belongs to, created from the version's company
 * and role when it has none (for the editor's status control and the old
 * cv_log_application tool).
 */
export async function ensureApplicationForVersion(
  slug: string,
  createdBy: string,
): Promise<JobApplication> {
  const v = await findVersion(slug);
  if (!v) throw new CvStoreError(`No CV version "${slug}".`);
  if (v.applicationId) {
    const app = await prisma.jobApplication.findUnique({
      where: { id: v.applicationId },
    });
    if (app) return app;
  }
  if (!v.company)
    throw new CvStoreError("Set the company on this CV version first.");
  const app = await prisma.jobApplication.create({
    data: {
      company: v.company,
      role: v.targetRole || v.title,
      jobDescription: v.jobDescription,
      sentCvId: v.id,
      createdBy,
      events: {
        create: {
          kind: "stage",
          stage: "WISHLIST",
          title: stageEventTitle(null, "WISHLIST"),
        },
      },
    },
  });
  if (!v.isPrimary)
    await prisma.cvVersion.update({
      where: { id: v.id },
      data: { applicationId: app.id },
    });
  return app;
}

/**
 * Write the application's current stage to its brain note (created on first
 * sync). Best effort: returns null when the brain is not configured or fails.
 * Sends company, role, stage, source, job link, CV link and ATS score only.
 */
export async function syncApplicationToBrain(
  id: string,
  note?: string | null,
): Promise<string | null> {
  if (!brainConfigured()) return null;
  const app = await prisma.jobApplication.findUnique({
    where: { id },
    include: {
      sentCv: true,
      versions: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });
  if (!app) return null;
  const cv = app.sentCv ?? app.versions[0] ?? null;
  const url = cv
    ? cv.isPrimary
      ? CV_URL()
      : `${CV_URL()}/v/${cv.slug}`
    : null;
  const path = await logApplication(
    {
      company: app.company,
      role: app.role,
      cvSlug: cv?.slug,
      cvUrl: url && cv ? (cv.isPublic ? url : `${url} (private)`) : null,
      atsScore: cv?.atsScore,
      status: STAGE_LABEL[app.stage].toLowerCase(),
      source: app.source,
      jobUrl: app.jobUrl,
      note: note ?? undefined,
    },
    app.brainNotePath,
  );
  // Raw update so the note path does not bump updatedAt (an open editor's version check).
  if (path && path !== app.brainNotePath) {
    await prisma.$executeRaw`UPDATE "job_applications" SET "brainNotePath" = ${path} WHERE "id" = ${id}`;
  }
  return path;
}
