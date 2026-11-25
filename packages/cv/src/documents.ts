import { prisma, type DocumentKind } from "@ecosystem/database";
import { CvStoreError } from "./store";

/**
 * Database side of the document library. The file itself lives in the private
 * "documents" storage bucket; the manager uploads it and records the path here.
 * Nothing in this module hands out a link.
 */

export const DOCUMENT_KINDS = [
  "DIPLOMA",
  "TRANSCRIPT",
  "CERTIFICATE",
  "OTHER",
] as const satisfies readonly DocumentKind[];

export async function listDocuments() {
  return prisma.document.findMany({
    include: { _count: { select: { applications: true } } },
    orderBy: [{ kind: "asc" }, { title: "asc" }],
  });
}

export async function recordDocument(input: {
  kind: DocumentKind;
  title: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}) {
  return prisma.document.create({ data: input });
}

export async function renameDocument(
  id: string,
  patch: { title?: string; kind?: DocumentKind },
) {
  return prisma.document.update({ where: { id }, data: patch });
}

/** Removes the row (and its attachments). The caller deletes the stored file. */
export async function removeDocument(id: string) {
  const row = await prisma.document.findUnique({ where: { id } });
  if (!row) throw new CvStoreError("Document not found.");
  await prisma.document.delete({ where: { id } });
  return row;
}

export async function attachDocument(
  applicationId: string,
  documentId: string,
) {
  const [app, doc] = await Promise.all([
    prisma.jobApplication.findUnique({
      where: { id: applicationId },
      select: { id: true },
    }),
    prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true },
    }),
  ]);
  if (!app) throw new CvStoreError("Application not found.");
  if (!doc) throw new CvStoreError("Document not found.");
  await prisma.applicationDocument.upsert({
    where: { applicationId_documentId: { applicationId, documentId } },
    create: { applicationId, documentId },
    update: {},
  });
}

export async function detachDocument(
  applicationId: string,
  documentId: string,
) {
  await prisma.applicationDocument.deleteMany({
    where: { applicationId, documentId },
  });
}

export async function documentsFor(applicationId: string) {
  const rows = await prisma.applicationDocument.findMany({
    where: { applicationId },
    include: { document: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => r.document);
}
