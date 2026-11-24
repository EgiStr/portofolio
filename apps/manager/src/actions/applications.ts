"use server";

import { after } from "next/server";
import { getServerSession } from "next-auth";
import { CvStoreError } from "@ecosystem/cv-core/store";
import {
  addEvent,
  createApplication,
  createVersionFor,
  deleteApplication,
  deleteEvent,
  getApplication,
  linkVersion,
  moveStage,
  setSentCv,
  syncApplicationToBrain,
  updateApplication,
  type ApplicationFields,
  type CreateApplicationInput,
  type EventInput,
} from "@ecosystem/cv-core/applications";
import { brainConfigured } from "@ecosystem/cv-core/brain";
import type { Stage } from "@ecosystem/cv-core";
import { authOptions } from "@/lib/auth";

/**
 * Job tracker server actions. Same pattern as actions/cv.ts: each action checks
 * the session, writes through the shared store, and returns a Result. Brain
 * sync runs after the response, so a board move is
 * not held up by the brain.
 */

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  if (!(await getServerSession(authOptions)))
    return { ok: false, error: "Unauthorized" };
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof CvStoreError) return { ok: false, error: e.message };
    console.error("[applications action]", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
    };
  }
}

function syncLater(id: string, note?: string | null) {
  after(async () => {
    try {
      await syncApplicationToBrain(id, note);
    } catch (e) {
      console.error("[brain sync]", e);
    }
  });
}

export async function getApplicationAction(id: string) {
  return run(() => getApplication(id));
}

export async function createApplicationAction(
  input: Omit<CreateApplicationInput, "createdBy">,
) {
  return run(async () => {
    const app = await createApplication({ ...input, createdBy: "manager" });
    syncLater(app.id);
    return { id: app.id };
  });
}

export async function saveApplicationAction(
  id: string,
  expectedUpdatedAt: string,
  patch: ApplicationFields & { stage?: Stage },
) {
  return run(async () => {
    const { moved } = await updateApplication(id, expectedUpdatedAt, patch);
    if (moved) syncLater(id);
    return getApplication(id);
  });
}

export async function moveStageAction(id: string, stage: Stage, note?: string) {
  return run(async () => {
    const { row, moved } = await moveStage(id, stage, note);
    if (moved) syncLater(id, note);
    return {
      id: row.id,
      stage: row.stage,
      appliedAt: row.appliedAt,
      updatedAt: row.updatedAt,
    };
  });
}

export async function addEventAction(id: string, e: EventInput) {
  return run(async () => {
    await addEvent(id, e);
    return getApplication(id);
  });
}

export async function deleteEventAction(id: string, eventId: string) {
  return run(async () => {
    await deleteEvent(id, eventId);
    return getApplication(id);
  });
}

export async function deleteApplicationAction(id: string) {
  return run(async () => {
    await deleteApplication(id);
    return { id };
  });
}

export async function newVersionForAction(
  id: string,
  baseSlug?: string | null,
) {
  return run(async () => {
    const row = await createVersionFor(id, baseSlug, "manager");
    return { slug: row.slug };
  });
}

export async function linkVersionAction(
  id: string,
  slug: string,
  link: boolean,
) {
  return run(async () => {
    await linkVersion(slug, link ? id : null);
    return getApplication(id);
  });
}

export async function setSentCvAction(id: string, slug: string | null) {
  return run(async () => {
    await setSentCv(id, slug);
    syncLater(id);
    return getApplication(id);
  });
}

/** Manual sync from the detail page; waits for the brain so it can report the result. */
export async function syncBrainAction(id: string) {
  return run(async () => {
    if (!brainConfigured())
      throw new CvStoreError(
        "Brain is not configured (BRAIN_MCP_URL, BRAIN_MCP_TOKEN).",
      );
    const path = await syncApplicationToBrain(
      id,
      "Synced from the job tracker.",
    );
    if (!path) throw new CvStoreError("Brain write failed. Try again later.");
    return { path };
  });
}
