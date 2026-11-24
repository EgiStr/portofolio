import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { listApplications } from "@ecosystem/cv-core/applications";
import { listVersions } from "@ecosystem/cv-core/store";
import { authOptions } from "@/lib/auth";
import {
  TrackerBoard,
  type BoardCard,
} from "@/components/applications/tracker-board";

export const dynamic = "force-dynamic";

export default async function JobTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const [apps, versions] = await Promise.all([
    listApplications(),
    listVersions(),
  ]);

  const cards: BoardCard[] = apps.map((a) => ({
    id: a.id,
    company: a.company,
    role: a.role,
    location: a.location,
    source: a.source,
    stage: a.stage,
    appliedAt: a.appliedAt?.toISOString() ?? null,
    followUpAt: a.followUpAt?.toISOString() ?? null,
    updatedAt: a.updatedAt.toISOString(),
    sentCv: a.sentCv
      ? {
          slug: a.sentCv.slug,
          title: a.sentCv.title,
          atsScore: a.sentCv.atsScore,
        }
      : null,
    versionCount: a.versions.length,
    bestAts: a.versions.reduce<number | null>(
      (m, v) =>
        v.atsScore != null && (m == null || v.atsScore > m) ? v.atsScore : m,
      null,
    ),
    lastEvent: a.events[0]
      ? { title: a.events[0].title, at: a.events[0].at.toISOString() }
      : null,
  }));

  return (
    <TrackerBoard
      initial={cards}
      openNew={(await searchParams).new === "1"}
      bases={versions.map((v) => ({
        slug: v.slug,
        title: v.title,
        isPrimary: v.isPrimary,
      }))}
    />
  );
}
