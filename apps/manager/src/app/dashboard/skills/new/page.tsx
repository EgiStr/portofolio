import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RecordDocument } from "@/components/document/record-document";
import { skillDoc } from "@/components/document/configs";

export default async function NewRecordPage() {
  if (!(await getServerSession(authOptions))) redirect("/login");
  return (
    <RecordDocument
      {...skillDoc}
      id={null}
      updatedAt={null}
      values={skillDoc.defaults}
    />
  );
}
