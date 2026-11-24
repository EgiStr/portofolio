import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getApplication } from "@ecosystem/cv-core/applications";
import { listVersions } from "@ecosystem/cv-core/store";
import { brainConfigured } from "@ecosystem/cv-core/brain";
import { authOptions } from "@/lib/auth";
import { ApplicationDetailView } from "@/components/applications/application-detail";

export const dynamic = "force-dynamic";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const { id } = await params;
  const app = await getApplication(id).catch(() => null);
  if (!app) notFound();
  const versions = await listVersions();

  return (
    <ApplicationDetailView
      initial={app}
      allVersions={versions.map((v) => ({
        slug: v.slug,
        title: v.title,
        isPrimary: v.isPrimary,
        applicationId: v.applicationId,
      }))}
      brain={brainConfigured()}
    />
  );
}
