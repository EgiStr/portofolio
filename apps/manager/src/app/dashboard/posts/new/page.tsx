import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RecordDocument } from "@/components/document/record-document";
import { postDoc } from "@/components/document/configs";

export default async function NewPostPage() {
  if (!(await getServerSession(authOptions))) redirect("/login");
  return (
    <RecordDocument
      {...postDoc}
      id={null}
      updatedAt={null}
      values={postDoc.defaults}
    />
  );
}
