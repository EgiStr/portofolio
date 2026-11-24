-- Additive only. Applied with `prisma db execute` instead of `db push`, because
-- `db push` would also apply unrelated drift (drops eds_folders_parentId_name_key).
CREATE TYPE "CvKind" AS ENUM ('BASE', 'TAILORED');
CREATE TABLE "cv_versions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "CvKind" NOT NULL DEFAULT 'TAILORED',
    "targetRole" TEXT,
    "company" TEXT,
    "jobDescription" TEXT,
    "content" JSONB NOT NULL,
    "style" JSONB,
    "atsScore" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "brainNotePath" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cv_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cv_versions_slug_key" ON "cv_versions"("slug");
CREATE INDEX "cv_versions_isPrimary_idx" ON "cv_versions"("isPrimary");
