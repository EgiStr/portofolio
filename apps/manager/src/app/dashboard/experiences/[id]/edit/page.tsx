import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { experiences } from "@/lib/content";
import { RecordDocument } from "@/components/document/record-document";
import { experienceDoc } from "@/components/document/configs";

export const dynamic = "force-dynamic";

export default async function ExperienceDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const e = await experiences.get((await params).id).catch(() => notFound());
  return (
    <RecordDocument
      {...experienceDoc}
      id={e.id}
      updatedAt={e.updatedAt.toISOString()}
      values={{
        position: e.position,
        company: e.company,
        location: e.location,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate?.toISOString() ?? null,
        current: e.current,
        companyUrl: e.companyUrl,
        order: e.order,
        description: e.description,
        companyLogo: e.companyLogo,
      }}
    />
  );
}
