import { after } from "next/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CoverLetter } from "@ecosystem/database";
import { z } from "zod";
import { LetterContentSchema, letterCheck } from "@ecosystem/cv-core";
import { CvStoreError } from "@ecosystem/cv-core/store";
import {
  createLetter,
  findLetter,
  listLetters,
  parseLetter,
  updateLetter,
} from "@ecosystem/cv-core/letters";
import {
  attachDocument,
  detachDocument,
  listDocuments,
} from "@ecosystem/cv-core/documents";
import { fanoutRevalidate } from "@/lib/revalidate-fanout";

const SITE_URL =
  process.env.NEXT_PUBLIC_CV_URL ?? "https://cv.eggisatria.my.id";

export const LETTER_INSTRUCTIONS = `Cover letters: cover_list, cover_get, cover_create (a blank letter addressed to the application's company, sender taken from the CV), cover_update (needs expectedUpdatedAt from your last read). Write in the first person from the CV and the job description only, and never invent an employer, number or date. Read the report that comes back: errors block sending, warnings are advice. Documents: doc_list shows the private library (diploma, transcript); job_attach_document links one to an application. The files themselves are never returned.`;

const text = (value: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
    },
  ],
});
const fail = (message: string) => ({ ...text(message), isError: true });

async function guard(fn: () => Promise<ReturnType<typeof text>>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof CvStoreError) return fail(e.message);
    throw e;
  }
}

function revalidateCv() {
  after(async () => {
    await fanoutRevalidate(["cv"]).catch(() => {});
  });
}

function meta(row: CoverLetter) {
  return {
    slug: row.slug,
    title: row.title,
    company: row.company,
    targetRole: row.targetRole,
    applicationId: row.applicationId,
    isPublic: row.isPublic,
    updatedAt: row.updatedAt.toISOString(),
    url: row.isPublic ? `${SITE_URL}/letter/${row.slug}` : null,
  };
}

export function registerLetterTools(server: McpServer, actor: string) {
  server.registerTool(
    "cover_list",
    {
      title: "List cover letters",
      description:
        "Cover letters, newest first. Pass applicationId to see the ones for one application.",
      inputSchema: { applicationId: z.string().optional() },
    },
    async ({ applicationId }) =>
      guard(async () =>
        text((await listLetters(applicationId)).map((r) => meta(r))),
      ),
  );

  server.registerTool(
    "cover_get",
    {
      title: "Read a cover letter",
      description:
        "The full letter with its checks. Keep updatedAt to save changes with cover_update.",
      inputSchema: { slug: z.string() },
    },
    async ({ slug }) =>
      guard(async () => {
        const row = await findLetter(slug);
        if (!row) throw new CvStoreError(`No cover letter "${slug}".`);
        const content = parseLetter(row.content);
        return text({
          ...meta(row),
          content,
          report: letterCheck(content),
        });
      }),
  );

  server.registerTool(
    "cover_create",
    {
      title: "Create a cover letter",
      description:
        "Creates a letter for an application (company and role come from it) or for a named company. Without content it starts blank, with the sender taken from the CV. Private until isPublic is true.",
      inputSchema: {
        applicationId: z.string().optional(),
        company: z.string().optional(),
        targetRole: z.string().optional(),
        cvSlug: z.string().optional(),
        title: z.string().optional(),
        content: LetterContentSchema.optional(),
        isPublic: z.boolean().optional(),
      },
    },
    async (input) =>
      guard(async () => {
        const { row, report } = await createLetter({
          ...input,
          createdBy: actor,
        });
        if (row.isPublic) revalidateCv();
        return text({ ...meta(row), report });
      }),
  );

  server.registerTool(
    "cover_update",
    {
      title: "Edit a cover letter",
      description:
        "Replaces the fields you pass; content is replaced whole, so send the complete letter. Fails if the letter changed since expectedUpdatedAt.",
      inputSchema: {
        slug: z.string(),
        expectedUpdatedAt: z.string(),
        title: z.string().optional(),
        content: LetterContentSchema.optional(),
        isPublic: z.boolean().optional(),
        applicationId: z.string().nullish(),
      },
    },
    async ({ slug, expectedUpdatedAt, ...patch }) =>
      guard(async () => {
        const { row, report } = await updateLetter(
          slug,
          expectedUpdatedAt,
          patch,
        );
        revalidateCv();
        return text({ ...meta(row), report });
      }),
  );

  server.registerTool(
    "doc_list",
    {
      title: "List the document library",
      description:
        "Diplomas, transcripts and certificates in the private library. Returns titles and ids only, never the files.",
      inputSchema: {},
    },
    async () =>
      guard(async () =>
        text(
          (await listDocuments()).map((d) => ({
            id: d.id,
            kind: d.kind,
            title: d.title,
            fileName: d.fileName,
            sizeBytes: d.sizeBytes,
            attachedTo: d._count.applications,
          })),
        ),
      ),
  );

  server.registerTool(
    "job_attach_document",
    {
      title: "Attach a library document to an application",
      description:
        "Links a document from doc_list to an application, or removes the link with detach: true.",
      inputSchema: {
        applicationId: z.string(),
        documentId: z.string(),
        detach: z.boolean().optional(),
      },
    },
    async ({ applicationId, documentId, detach }) =>
      guard(async () => {
        if (detach) await detachDocument(applicationId, documentId);
        else await attachDocument(applicationId, documentId);
        return text({ applicationId, documentId, attached: !detach });
      }),
  );
}
