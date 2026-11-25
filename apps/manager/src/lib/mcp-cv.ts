import { after } from "next/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CvVersion } from "@ecosystem/database";
import {
  atsCheck,
  isStage,
  LEGACY_STATUS,
  plainText,
  STAGES,
  type CvContent,
  type Stage,
} from "@ecosystem/cv-core";
import {
  createVersion,
  CvStoreError,
  findVersion,
  listVersions,
  parseContent,
  profileData,
  updateVersion,
} from "@ecosystem/cv-core/store";
import {
  brainConfigured,
  brainRead,
  brainSearch,
} from "@ecosystem/cv-core/brain";
import {
  addEvent,
  createApplication,
  createVersionFor,
  ensureApplicationForVersion,
  getApplication,
  listApplications,
  moveStage,
  setSentCv,
  syncApplicationToBrain,
  updateApplication,
} from "@ecosystem/cv-core/applications";
import { fanoutRevalidate } from "@/lib/revalidate-fanout";

const SITE_URL =
  process.env.NEXT_PUBLIC_CV_URL ?? "https://cv.eggisatria.my.id";

export const CV_INSTRUCTIONS = `CV studio for cv.eggisatria.my.id. Read with cv_get (the primary CV when no slug is given) and cv_profile_data (the website's own experience, project, certification and skill records). Tailor by calling cv_create_version with a job description, then cv_ats_check. Never add a fact, employer, number or date that is not in cv_get, cv_profile_data or the user's own words. Bullets start with a verb, contain no dashes as punctuation, and stay under 45 words. cv_update_version needs expectedUpdatedAt from your last read. Job applications: job_list_applications, job_get_application, job_create_application (can create the tailored CV in the same call), job_move_stage, job_add_event, job_attach_cv, job_update_application. Recruiter contacts and salary are private: they are returned only with includePrivate and must never be copied into the brain or a CV.`;

const text = (value: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
    },
  ],
});
const fail = (message: string) => ({ ...text(message), isError: true });

function summary(row: CvVersion) {
  return {
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    targetRole: row.targetRole,
    company: row.company,
    atsScore: row.atsScore,
    isPublic: row.isPublic,
    isPrimary: row.isPrimary,
    applicationId: row.applicationId,
    updatedAt: row.updatedAt.toISOString(),
    url: row.isPublic
      ? row.isPrimary
        ? SITE_URL
        : `${SITE_URL}/v/${row.slug}`
      : null,
    pdf: row.isPublic
      ? row.isPrimary
        ? `${SITE_URL}/pdf`
        : `${SITE_URL}/v/${row.slug}/pdf`
      : null,
  };
}

function syncLater(id: string, note?: string | null) {
  after(async () => {
    await syncApplicationToBrain(id, note).catch((e) =>
      console.error("[brain sync]", e),
    );
  });
}

type App = Awaited<ReturnType<typeof getApplication>>;
const PRIVATE = [
  "contactName",
  "contactEmail",
  "contactUrl",
  "salaryExpected",
  "salaryOffer",
] as const;

/** Application for agents: private fields only on request, CV versions as summaries. */
function appView(a: App, includePrivate = false) {
  const { versions, sentCv, events, letters, documents, ...rest } = a;
  const base: Record<string, unknown> = { ...rest };
  if (!includePrivate) for (const k of PRIVATE) delete base[k];
  return {
    ...base,
    versions: versions.map((v) => ({
      slug: v.slug,
      title: v.title,
      atsScore: v.atsScore,
      isPublic: v.isPublic,
      updatedAt: v.updatedAt,
    })),
    sentCv: sentCv
      ? { slug: sentCv.slug, title: sentCv.title, atsScore: sentCv.atsScore }
      : null,
    letters: letters.map((l) => ({
      slug: l.slug,
      title: l.title,
      isPublic: l.isPublic,
      updatedAt: l.updatedAt,
    })),
    documents: documents.map((d) => ({
      id: d.document.id,
      kind: d.document.kind,
      title: d.document.title,
    })),
    events: events.map((e) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      at: e.at,
      notes: e.notes,
    })),
  };
}

/** Run a store call and turn its validation errors into tool errors. */
async function guard(fn: () => Promise<ReturnType<typeof text>>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof CvStoreError) return fail(e.message);
    throw e;
  }
}

/** The CV site caches its pages, so tell it to refresh once the response is out. */
function revalidateCv() {
  after(async () => {
    await fanoutRevalidate(["cv"]).catch(() => {});
  });
}

/** CV versions and job applications, registered on the manager MCP server. */
export function registerCvTools(server: McpServer, actor: string) {
  server.registerTool(
    "cv_list_versions",
    {
      title: "List CV versions",
      description:
        "Every CV version with its slug, target, ATS score and public links.",
      inputSchema: {},
    },
    async () => {
      return text((await listVersions()).map(summary));
    },
  );

  server.registerTool(
    "cv_get",
    {
      title: "Read a CV version",
      description:
        "Full structured content of one version (the primary CV when slug is omitted), plus its plain text as an ATS would read it.",
      inputSchema: {
        slug: z.string().optional(),
        format: z.enum(["json", "text"]).default("json"),
      },
    },
    async ({ slug, format }) =>
      guard(async () => {
        const row = await findVersion(slug);
        if (!row)
          return fail(slug ? `No CV version "${slug}".` : "No primary CV yet.");
        const content = parseContent(row.content);
        if (format === "text") return text(plainText(content));
        return text({
          ...summary(row),
          jobDescription: row.jobDescription,
          style: row.style,
          content,
        });
      }),
  );

  server.registerTool(
    "cv_profile_data",
    {
      title: "Website profile records",
      description:
        "Experience, published projects, certifications and skills from the website database, already shaped as CV entries. Use these as the source of facts.",
      inputSchema: {},
    },
    async () => text(await profileData()),
  );

  server.registerTool(
    "cv_ats_check",
    {
      title: "ATS check",
      description:
        "Deterministic ATS lint (contact, standard headings, dates, bullet length, dashes, first person) and, with a job description, keyword coverage. Pass a slug or raw content.",
      inputSchema: {
        slug: z.string().optional(),
        content: z.unknown().optional(),
        jobDescription: z.string().optional(),
      },
    },
    async ({ slug, content, jobDescription }) =>
      guard(async () => {
        let cv: CvContent;
        let jd = jobDescription;
        if (content !== undefined) cv = parseContent(content);
        else {
          const row = await findVersion(slug);
          if (!row) return fail("CV version not found.");
          cv = parseContent(row.content);
          jd ??= row.jobDescription ?? undefined;
        }
        return text(atsCheck(cv, jd));
      }),
  );

  server.registerTool(
    "cv_create_version",
    {
      title: "Create a tailored CV version",
      description:
        "Copy a base version (the primary CV by default) into a new private version for one job. Pass content to start from edited content instead. Returns the new slug and ATS report.",
      inputSchema: {
        title: z.string().min(3).max(120),
        targetRole: z.string().max(120).optional(),
        company: z.string().max(120).optional(),
        jobDescription: z.string().max(20000).optional(),
        baseSlug: z.string().optional(),
        content: z.unknown().optional(),
        isPublic: z.boolean().default(false),
      },
    },
    async (args) =>
      guard(async () => {
        const { row, ats } = await createVersion({ ...args, createdBy: actor });
        revalidateCv();
        return text({ ...summary(row), ats });
      }),
  );

  server.registerTool(
    "cv_update_version",
    {
      title: "Update a CV version",
      description:
        "Replace fields of one version. expectedUpdatedAt must equal updatedAt from your last cv_get, so edits made elsewhere are not overwritten. Setting isPrimary makes this version the public CV at the site root (and public).",
      inputSchema: {
        slug: z.string(),
        expectedUpdatedAt: z.string(),
        title: z.string().min(3).max(120).optional(),
        targetRole: z.string().max(120).nullable().optional(),
        company: z.string().max(120).nullable().optional(),
        jobDescription: z.string().max(20000).nullable().optional(),
        content: z.unknown().optional(),
        style: z.unknown().optional(),
        isPublic: z.boolean().optional(),
        isPrimary: z.boolean().optional(),
      },
    },
    async ({ slug, expectedUpdatedAt, ...patch }) =>
      guard(async () => {
        const { row, ats } = await updateVersion(
          slug,
          expectedUpdatedAt,
          patch,
        );
        revalidateCv();
        return text({ ...summary(row), ats });
      }),
  );

  server.registerTool(
    "cv_brain_search",
    {
      title: "Search the second brain for CV facts",
      description:
        "Search the owner's second brain (project notes, profile) for facts to support a bullet. Pass path to read one note instead. Use only what the notes state.",
      inputSchema: {
        query: z.string().min(2).max(300).optional(),
        path: z.string().max(300).optional(),
      },
    },
    async ({ query, path }) => {
      if (!brainConfigured())
        return fail(
          "Brain is not configured on this server (BRAIN_MCP_URL, BRAIN_MCP_TOKEN).",
        );
      if (path)
        return text(
          (await brainRead(path)) ?? "Note not found or brain unreachable.",
        );
      if (!query) return fail("Pass query or path.");
      return text(await brainSearch(query));
    },
  );

  server.registerTool(
    "cv_log_application",
    {
      title: "Track a CV version as a job application",
      description:
        "Move the job application this CV version belongs to (created from the version's company and role when it has none) to a stage, and update its brain note. Prefer job_move_stage when you have the application id.",
      inputSchema: {
        slug: z.string(),
        status: z
          .string()
          .describe(
            `One of ${STAGES.join(", ")}. Older names drafted, applied, interview, offer, rejected, withdrawn also work.`,
          ),
        note: z.string().max(300).optional(),
      },
    },
    async ({ slug, status, note }) =>
      guard(async () => {
        const up = status.toUpperCase();
        const to: Stage | undefined = isStage(up)
          ? up
          : LEGACY_STATUS[status.toLowerCase()];
        if (!to) return fail(`Unknown status "${status}".`);
        const app = await ensureApplicationForVersion(slug, actor);
        await moveStage(app.id, to, note);
        syncLater(app.id, note);
        return text({
          applicationId: app.id,
          stage: to,
          brain: brainConfigured()
            ? "note updates after this call"
            : "not configured",
        });
      }),
  );

  server.registerTool(
    "job_list_applications",
    {
      title: "List job applications",
      description:
        "Every application with company, role, stage, dates, source, CV versions and the CV sent. No contacts or salary.",
      inputSchema: { stage: z.enum(STAGES).optional() },
    },
    async ({ stage }) => {
      const apps = await listApplications();
      return text(
        apps
          .filter((a) => !stage || a.stage === stage)
          .map((a) => ({
            id: a.id,
            company: a.company,
            role: a.role,
            stage: a.stage,
            source: a.source,
            location: a.location,
            appliedAt: a.appliedAt,
            followUpAt: a.followUpAt,
            sentCv: a.sentCv?.slug ?? null,
            versions: a.versions.map((v) => ({
              slug: v.slug,
              atsScore: v.atsScore,
            })),
            lastEvent: a.events[0] ?? null,
            updatedAt: a.updatedAt.toISOString(),
          })),
      );
    },
  );

  server.registerTool(
    "job_get_application",
    {
      title: "Read one job application",
      description:
        "Fields, job description, CV versions and timeline. Contacts and salary only with includePrivate (never copy them into the brain).",
      inputSchema: {
        id: z.string(),
        includePrivate: z.boolean().default(false),
      },
    },
    async ({ id, includePrivate }) =>
      guard(async () =>
        text(appView(await getApplication(id), includePrivate)),
      ),
  );

  const fields = {
    location: z.string().max(200).nullish(),
    jobUrl: z.string().max(1000).nullish(),
    source: z.string().max(100).nullish(),
    jobDescription: z.string().max(20000).nullish(),
    appliedAt: z.string().nullish().describe("ISO date"),
    followUpAt: z.string().nullish().describe("ISO date"),
    notes: z.string().max(5000).nullish(),
  };

  server.registerTool(
    "job_create_application",
    {
      title: "Create a job application",
      description:
        "Add an application. With createCv, also creates a tailored CV version (copied from cvBaseSlug, the primary CV by default) linked to it.",
      inputSchema: {
        company: z.string().min(1).max(200),
        role: z.string().min(1).max(200),
        stage: z.enum(STAGES).default("WISHLIST"),
        createCv: z.boolean().default(false),
        cvBaseSlug: z.string().optional(),
        ...fields,
      },
    },
    async (input) =>
      guard(async () => {
        const app = await createApplication({ ...input, createdBy: actor });
        syncLater(app.id);
        revalidateCv();
        return text(appView(await getApplication(app.id)));
      }),
  );

  server.registerTool(
    "job_update_application",
    {
      title: "Update a job application",
      description:
        "Change fields (and optionally the stage). Needs expectedUpdatedAt from your last read.",
      inputSchema: {
        id: z.string(),
        expectedUpdatedAt: z.string(),
        company: z.string().min(1).max(200).optional(),
        role: z.string().min(1).max(200).optional(),
        stage: z.enum(STAGES).optional(),
        ...fields,
      },
    },
    async ({ id, expectedUpdatedAt, ...patch }) =>
      guard(async () => {
        const { moved } = await updateApplication(id, expectedUpdatedAt, patch);
        if (moved) syncLater(id);
        return text(appView(await getApplication(id)));
      }),
  );

  server.registerTool(
    "job_move_stage",
    {
      title: "Move a job application to a stage",
      description:
        "Change the stage, add it to the timeline and update the brain note.",
      inputSchema: {
        id: z.string(),
        stage: z.enum(STAGES),
        note: z.string().max(300).optional(),
      },
    },
    async ({ id, stage, note }) =>
      guard(async () => {
        const { row, moved } = await moveStage(id, stage, note);
        if (moved) syncLater(id, note);
        return text({
          id: row.id,
          stage: row.stage,
          appliedAt: row.appliedAt,
          updatedAt: row.updatedAt.toISOString(),
          moved,
        });
      }),
  );

  server.registerTool(
    "job_add_event",
    {
      title: "Add a timeline event",
      description:
        "Record an interview round, a test, a follow-up or a note on an application.",
      inputSchema: {
        id: z.string(),
        kind: z.enum(["interview", "assessment", "note", "follow_up"]),
        title: z.string().min(1).max(200),
        at: z.string().optional().describe("ISO date-time, now by default"),
        notes: z.string().max(5000).optional(),
      },
    },
    async ({ id, ...e }) => guard(async () => text(await addEvent(id, e))),
  );

  server.registerTool(
    "job_attach_cv",
    {
      title: "Create or mark the CV for an application",
      description:
        "Either create a new tailored CV version for the application (newFromSlug, the primary CV when empty) or mark an existing version as sent (sentSlug).",
      inputSchema: {
        id: z.string(),
        newFromSlug: z.string().nullish(),
        sentSlug: z.string().optional(),
      },
    },
    async ({ id, newFromSlug, sentSlug }) =>
      guard(async () => {
        if (sentSlug) {
          await setSentCv(id, sentSlug);
          syncLater(id);
          return text({ id, sentCv: sentSlug });
        }
        const row = await createVersionFor(id, newFromSlug, actor);
        revalidateCv();
        return text(summary(row));
      }),
  );
}
