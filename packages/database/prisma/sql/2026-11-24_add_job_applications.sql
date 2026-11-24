-- Additive only, applied with `prisma db execute` (see 2026-11-24_add_cv_versions.sql).
CREATE TYPE "JobStage" AS ENUM ('WISHLIST', 'APPLIED', 'SCREENING', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'GHOSTED');

CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT,
    "jobUrl" TEXT,
    "source" TEXT,
    "jobDescription" TEXT,
    "stage" "JobStage" NOT NULL DEFAULT 'WISHLIST',
    "appliedAt" TIMESTAMP(3),
    "followUpAt" TIMESTAMP(3),
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactUrl" TEXT,
    "salaryExpected" TEXT,
    "salaryOffer" TEXT,
    "notes" TEXT,
    "brainNotePath" TEXT,
    "createdBy" TEXT,
    "sentCvId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "job_applications_stage_idx" ON "job_applications"("stage");

CREATE TABLE "job_application_events" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "stage" "JobStage",
    "title" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_application_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "job_application_events_applicationId_at_idx" ON "job_application_events"("applicationId", "at");

ALTER TABLE "cv_versions" ADD COLUMN "applicationId" TEXT;
CREATE INDEX "cv_versions_applicationId_idx" ON "cv_versions"("applicationId");

ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_sentCvId_fkey" FOREIGN KEY ("sentCvId") REFERENCES "cv_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "job_application_events" ADD CONSTRAINT "job_application_events_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
