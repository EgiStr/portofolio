"use server";

import { after } from "next/server";
import { getServerSession } from "next-auth";
import {
  CvStoreError,
  findVersion,
  parseContent,
} from "@ecosystem/cv-core/store";
import {
  createLetter,
  deleteLetter,
  findLetter,
  parseLetter,
  updateLetter,
  type UpdateLetterPatch,
} from "@ecosystem/cv-core/letters";
import { getApplication } from "@ecosystem/cv-core/applications";
import { letterCheck, parseLetterStyle } from "@ecosystem/cv-core";
import { authOptions } from "@/lib/auth";
import { fanoutRevalidate } from "@/lib/revalidate-fanout";

/**
 * Cover letter server actions. Same pattern as actions/applications.ts: each
 * action checks the session and writes through the shared cv-core store.
 */

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  if (!(await getServerSession(authOptions)))
    return { ok: false, error: "Unauthorized" };
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof CvStoreError) return { ok: false, error: e.message };
    console.error("[letters action]", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
    };
  }
}

function refreshCvSite() {
  after(async () => {
    await fanoutRevalidate(["cv"]).catch(() => {});
  });
}

export async function createLetterAction(applicationId: string) {
  return run(async () => {
    const { row } = await createLetter({
      applicationId,
      createdBy: "manager",
    });
    return { slug: row.slug };
  });
}

export async function saveLetterAction(
  slug: string,
  expectedUpdatedAt: string,
  patch: UpdateLetterPatch,
) {
  return run(async () => {
    const { row, report } = await updateLetter(slug, expectedUpdatedAt, patch);
    refreshCvSite();
    return {
      updatedAt: row.updatedAt.toISOString(),
      isPublic: row.isPublic,
      report,
    };
  });
}

export async function deleteLetterAction(slug: string) {
  return run(async () => {
    await deleteLetter(slug);
    refreshCvSite();
  });
}

/** Everything the letter editor needs, including a CV header to copy from. */
export async function loadLetterContext(slug: string) {
  const row = await findLetter(slug);
  if (!row) return null;
  const content = parseLetter(row.content);
  const application = row.applicationId
    ? await getApplication(row.applicationId).catch(() => null)
    : null;
  const cv = application?.sentCv
    ? await findVersion(application.sentCv.slug)
    : await findVersion(null);
  return {
    row: {
      slug: row.slug,
      title: row.title,
      isPublic: row.isPublic,
      applicationId: row.applicationId,
      updatedAt: row.updatedAt.toISOString(),
    },
    content,
    style: parseLetterStyle(row.style),
    report: letterCheck(content),
    application: application
      ? {
          id: application.id,
          company: application.company,
          role: application.role,
          jobDescription: application.jobDescription,
        }
      : null,
    cvHeader: cv ? parseContent(cv.content).header : null,
  };
}
