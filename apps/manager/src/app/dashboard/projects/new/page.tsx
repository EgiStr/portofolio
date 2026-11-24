import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RecordDocument } from "@/components/document/record-document";
import { projectDoc } from "@/components/document/configs";

export default async function NewRecordPage() {
  if (!(await getServerSession(authOptions))) redirect("/login");
  return (
    <RecordDocument
      {...projectDoc}
      id={null}
      updatedAt={null}
      values={projectDoc.defaults}
    />
  );
}
