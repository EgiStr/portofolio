"use server";

import { getServerSession } from "next-auth";
import {
  CvStoreError,
  findVersion,
  parseContent,
} from "@ecosystem/cv-core/store";
import { listLetters, parseLetter } from "@ecosystem/cv-core/letters";
import { parseLetterStyle, parseStyle } from "@ecosystem/cv-core";
import {
  DOCUMENT_KINDS,
  attachDocument,
  detachDocument,
  documentsFor,
  listDocuments,
  recordDocument,
  removeDocument,
  renameDocument,
} from "@ecosystem/cv-core/documents";
import { getApplication } from "@ecosystem/cv-core/applications";
import type { DocumentKind } from "@ecosystem/database";
import { authOptions } from "@/lib/auth";
import {
  BUCKETS,
  deleteFile,
  ensurePrivateBucket,
  signedUrl,
  supabase,
} from "@/lib/supabase";

/**
 * Document library actions (ijazah, transkrip, certificates). Files go to the
 * private "documents" bucket and are only ever read through short-lived signed
 * URLs handed out here, after a session check.
 */

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  if (!(await getServerSession(authOptions)))
    return { ok: false, error: "Unauthorized" };
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof CvStoreError) return { ok: false, error: e.message };
    console.error("[documents action]", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
    };
  }
}

const MAX_BYTES = 4 * 1024 * 1024;
const MIME = new Set(["application/pdf", "image/png", "image/jpeg"]);

const isKind = (v: unknown): v is DocumentKind =>
  typeof v === "string" && (DOCUMENT_KINDS as readonly string[]).includes(v);

export async function listDocumentsAction() {
  return run(async () =>
    (await listDocuments()).map((d) => ({
      id: d.id,
      kind: d.kind,
      title: d.title,
      fileName: d.fileName,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      attachedTo: d._count.applications,
    })),
  );
}

export async function uploadDocumentAction(form: FormData) {
  return run(async () => {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0)
      throw new CvStoreError("Choose a file.");
    if (file.size > MAX_BYTES) throw new CvStoreError("The file is over 4 MB.");
    if (!MIME.has(file.type))
      throw new CvStoreError("Only PDF, PNG and JPG files are accepted.");
    const kind = form.get("kind");
    if (!isKind(kind)) throw new CvStoreError("Pick a document type.");
    const title =
      String(form.get("title") ?? "").trim() ||
      file.name.replace(/\.[^.]+$/, "");

    const bucketError = await ensurePrivateBucket(BUCKETS.DOCUMENTS);
    if (bucketError) throw new Error(`Storage: ${bucketError}`);

    const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80);
    const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { error } = await supabase.storage
      .from(BUCKETS.DOCUMENTS)
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Upload failed: ${error.message}`);

    try {
      const row = await recordDocument({
        kind,
        title,
        fileName: file.name,
        storagePath,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      return { id: row.id };
    } catch (e) {
      await deleteFile(BUCKETS.DOCUMENTS, storagePath);
      throw e;
    }
  });
}

export async function renameDocumentAction(
  id: string,
  patch: { title?: string; kind?: DocumentKind },
) {
  return run(async () => {
    if (patch.kind !== undefined && !isKind(patch.kind))
      throw new CvStoreError("Unknown document type.");
    if (patch.title !== undefined && !patch.title.trim())
      throw new CvStoreError("The title cannot be empty.");
    await renameDocument(id, patch);
  });
}

export async function deleteDocumentAction(id: string) {
  return run(async () => {
    const row = await removeDocument(id);
    await deleteFile(BUCKETS.DOCUMENTS, row.storagePath);
  });
}

export async function attachDocumentAction(
  applicationId: string,
  documentId: string,
) {
  return run(async () => {
    await attachDocument(applicationId, documentId);
    return getApplication(applicationId);
  });
}

export async function detachDocumentAction(
  applicationId: string,
  documentId: string,
) {
  return run(async () => {
    await detachDocument(applicationId, documentId);
    return getApplication(applicationId);
  });
}

/** One-time link to view or download a stored file, valid five minutes. */
export async function documentLinkAction(id: string) {
  return run(async () => {
    const row = (await listDocuments()).find((d) => d.id === id);
    if (!row) throw new CvStoreError("Document not found.");
    const url = await signedUrl(BUCKETS.DOCUMENTS, row.storagePath, 300);
    if (!url) throw new Error("Could not create a link for that file.");
    return { url, fileName: row.fileName };
  });
}

/** What the browser needs to build the application's ZIP bundle. */
export async function bundleSourcesAction(applicationId: string) {
  return run(async () => {
    const app = await getApplication(applicationId);
    const docs = await documentsFor(applicationId);
    const files = [];
    for (const d of docs) {
      const url = await signedUrl(BUCKETS.DOCUMENTS, d.storagePath, 300);
      if (url) files.push({ fileName: d.fileName, kind: d.kind, url });
    }
    const cvRow = await findVersion(
      app.sentCv?.slug ?? app.versions[0]?.slug ?? null,
    );
    const letters = (await listLetters(applicationId)).map((l) => ({
      slug: l.slug,
      title: l.title,
      content: parseLetter(l.content),
      style: parseLetterStyle(l.style),
    }));
    return {
      company: app.company,
      files,
      cv: cvRow
        ? {
            title: cvRow.title,
            content: parseContent(cvRow.content),
            style: parseStyle(cvRow.style),
          }
        : null,
      letters,
    };
  });
}
