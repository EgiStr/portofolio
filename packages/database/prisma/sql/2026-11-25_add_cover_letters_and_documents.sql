-- Additive only, applied with `prisma db execute` (see 2026-11-24_add_job_applications.sql).
CREATE TYPE "DocumentKind" AS ENUM ('DIPLOMA', 'TRANSCRIPT', 'CERTIFICATE', 'OTHER');

CREATE TABLE "cover_letters" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "targetRole" TEXT,
    "content" JSONB NOT NULL,
    "style" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cover_letters_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cover_letters_slug_key" ON "cover_letters"("slug");
CREATE INDEX "cover_letters_applicationId_idx" ON "cover_letters"("applicationId");
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "documents_storagePath_key" ON "documents"("storagePath");

CREATE TABLE "application_documents" (
    "applicationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("applicationId", "documentId")
);
CREATE INDEX "application_documents_documentId_idx" ON "application_documents"("documentId");
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
