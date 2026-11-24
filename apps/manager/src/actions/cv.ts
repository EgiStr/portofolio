"use server";

import { getServerSession } from "next-auth";
import { after } from "next/server";
import {
  atsCheck,
  CvContentSchema,
  isStage,
  LEGACY_STATUS,
  type AtsReport,
  type CvContent,
  type Stage,
} from "@ecosystem/cv-core";
import {
  createVersion,
  CvStoreError,
  deleteVersion,
  findVersion,
  parseContent,
  profileData,
  updateVersion,
  type UpdatePatch,
} from "@ecosystem/cv-core/store";
import {
  brainConfigured,
  brainRead,
  brainSearch,
  type BrainHit,
} from "@ecosystem/cv-core/brain";
import {
  ensureApplicationForVersion,
  moveStage,
  syncApplicationToBrain,
} from "@ecosystem/cv-core/applications";
import { prisma } from "@ecosystem/database";
import { authOptions } from "@/lib/auth";
import { polishBullets, tailorText, type AiSuggestion } from "@/lib/gemini";
import { fanoutRevalidate } from "@/lib/revalidate-fanout";

/**
 * CV Studio server actions. The dashboard guard is client side only, so every
 * action checks the session itself. Writes go through the shared cv-core store
 * (same rules as the MCP endpoint) and then refresh cv.eggisatria.my.id.
 */

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  if (!(await getServerSession(authOptions)))
    return { ok: false, error: "Unauthorized" };
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof CvStoreError) return { ok: false, error: e.message };
    console.error("[cv action]", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
    };
  }
}

const CV_URL = process.env.NEXT_PUBLIC_CV_URL || "https://cv.eggisatria.my.id";

function refreshPublicSite() {
  // Fire and forget: the public site also refreshes itself every 5 minutes.
  fanoutRevalidate(["cv"]).catch(() => {});
}

export interface EditorVersion {
  slug: string;
  title: string;
  kind: string;
  targetRole: string | null;
  company: string | null;
  jobDescription: string | null;
  content: CvContent;
  style: unknown;
  isPublic: boolean;
  isPrimary: boolean;
  brainNotePath: string | null;
  /** The job application this version is tailored for, if any. */
  application: {
    id: string;
    company: string;
    role: string;
    stage: Stage;
  } | null;
  updatedAt: string;
  ats: AtsReport;
}

async function toEditor(slug: string): Promise<EditorVersion> {
  const row = await findVersion(slug);
  if (!row) throw new CvStoreError(`No CV version "${slug}".`);
  const content = parseContent(row.content);
  const application = row.applicationId
    ? await prisma.jobApplication.findUnique({
        where: { id: row.applicationId },
        select: { id: true, company: true, role: true, stage: true },
      })
    : null;
  return {
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    targetRole: row.targetRole,
    company: row.company,
    jobDescription: row.jobDescription,
    content,
    style: row.style,
    isPublic: row.isPublic,
    isPrimary: row.isPrimary,
    brainNotePath: row.brainNotePath,
    application,
    updatedAt: row.updatedAt.toISOString(),
    ats: atsCheck(content, row.jobDescription),
  };
}

export async function loadCvAction(slug: string) {
  return run(() => toEditor(slug));
}

export async function saveCvAction(
  slug: string,
  expectedUpdatedAt: string,
  patch: UpdatePatch,
) {
  return run(async () => {
    await updateVersion(slug, expectedUpdatedAt, patch);
    refreshPublicSite();
    return toEditor(slug);
  });
}

export async function createCvAction(input: {
  title: string;
  targetRole?: string;
  company?: string;
  jobDescription?: string;
  baseSlug?: string;
}) {
  return run(async () => {
    const { row } = await createVersion({ ...input, createdBy: "manager" });
    return { slug: row.slug };
  });
}

export async function deleteCvAction(slug: string) {
  return run(async () => {
    await deleteVersion(slug);
    refreshPublicSite();
    return { slug };
  });
}

/** Lint unsaved editor content (the client also runs atsCheck locally; this is for the JD-aware report). */
export async function atsAction(
  content: unknown,
  jobDescription?: string | null,
) {
  return run(async () => {
    const parsed = CvContentSchema.parse(content);
    return atsCheck(parsed, jobDescription);
  });
}

export async function profileDataAction() {
  return run(() => profileData());
}

export async function brainSearchAction(query: string) {
  return run(async (): Promise<{ configured: boolean; hits: BrainHit[] }> => {
    if (!brainConfigured()) return { configured: false, hits: [] };
    return { configured: true, hits: await brainSearch(query) };
  });
}

export async function brainReadAction(path: string) {
  return run(async () => (await brainRead(path)) ?? "");
}

export async function aiPolishAction(
  text: string,
  facts: string[],
  jobDescription?: string | null,
) {
  return run<AiSuggestion>(() =>
    polishBullets(text, facts, jobDescription ?? undefined),
  );
}

export async function aiTailorAction(
  text: string,
  jobDescription: string,
  facts: string[],
) {
  return run<AiSuggestion>(() => tailorText(text, jobDescription, facts));
}

/**
 * Track this version in the Job Tracker (creating the application from its
 * company and role when needed) and move it to `stage`. Older status names
 * (drafted, applied, ...) are still accepted. The brain note is updated after
 * the response.
 */
export async function logApplicationAction(
  slug: string,
  stage: Stage | string,
  note?: string,
) {
  return run(async () => {
    const to = isStage(stage) ? stage : LEGACY_STATUS[stage];
    if (!to) throw new CvStoreError(`Unknown stage "${stage}".`);
    const app = await ensureApplicationForVersion(slug, "manager");
    await moveStage(app.id, to, note);
    after(async () => {
      await syncApplicationToBrain(app.id, note).catch((e) =>
        console.error("[brain sync]", e),
      );
    });
    return toEditor(slug);
  });
}
