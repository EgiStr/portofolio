"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  certifications,
  ContentError,
  experiences,
  posts,
  projects,
  skills,
} from "@/lib/content";

export type Resource =
  | "posts"
  | "projects"
  | "experiences"
  | "skills"
  | "certifications";
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  if (!(await getServerSession(authOptions)))
    return { ok: false, error: "Your session ended. Sign in again." };
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ContentError) return { ok: false, error: e.message };
    console.error("[content action]", e);
    return { ok: false, error: "Could not save. Try again." };
  }
}

/**
 * Save one or more fields of a row from a table cell. Rows with an updatedAt
 * column are compare-and-set, so an edit made elsewhere (another tab, ZIA)
 * is never overwritten silently. Returns the new updatedAt.
 */
export async function saveCellAction(
  resource: Resource,
  id: string,
  expectedUpdatedAt: string | null,
  patch: Record<string, unknown>,
) {
  return run(async () => {
    const cas = expectedUpdatedAt ?? "";
    const row =
      resource === "posts"
        ? await posts.update(id, cas, patch)
        : resource === "projects"
          ? await projects.update(id, cas, patch)
          : resource === "experiences"
            ? await experiences.update(id, cas, patch)
            : resource === "certifications"
              ? await certifications.update(id, cas, patch)
              : await skills.update(id, patch);
    return {
      updatedAt:
        "updatedAt" in row ? (row.updatedAt as Date).toISOString() : null,
    };
  });
}

export async function deleteRowAction(resource: Resource, id: string) {
  return run(async () => {
    const table = { posts, projects, experiences, skills, certifications }[
      resource
    ];
    await table.remove(id);
    return { id };
  });
}

/** Create a skill straight from the table's "New" row (other kinds open a page). */
export async function createSkillAction(name: string) {
  return run(async () => {
    const row = await skills.create({ name: name.trim() });
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      level: row.level,
      order: row.order,
    };
  });
}
