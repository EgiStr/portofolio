import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { certifications, skills } from "@/lib/content";
import { RecordDocument } from "@/components/document/record-document";
import { certificationDoc } from "@/components/document/configs";

export const dynamic = "force-dynamic";

export default async function CertificationDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const id = (await params).id;
  const [c, all] = await Promise.all([
    certifications.get(id).catch(() => notFound()),
    skills.list(),
  ]);
  return (
    <RecordDocument
      {...certificationDoc(all.map((s) => ({ value: s.id, label: s.name })))}
      id={c.id}
      updatedAt={c.updatedAt.toISOString()}
      values={{
        name: c.name,
        organization: c.organization,
        category: c.category,
        issueDate: c.issueDate.toISOString(),
        credentialId: c.credentialId,
        verificationUrl: c.verificationUrl,
        displayOrder: c.displayOrder,
        skillIds: c.skills.map((s) => s.skill.id),
        organizationLogo: c.organizationLogo,
        certificateFile: c.certificateFile,
      }}
    />
  );
}
