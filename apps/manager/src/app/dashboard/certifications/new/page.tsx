import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { skills } from "@/lib/content";
import { RecordDocument } from "@/components/document/record-document";
import { certificationDoc } from "@/components/document/configs";

export const dynamic = "force-dynamic";

export default async function NewCertificationPage() {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const doc = certificationDoc(
    (await skills.list()).map((s) => ({ value: s.id, label: s.name })),
  );
  return (
    <RecordDocument {...doc} id={null} updatedAt={null} values={doc.defaults} />
  );
}
