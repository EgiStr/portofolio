import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { skills } from "@/lib/content";
import { RecordDocument } from "@/components/document/record-document";
import { skillDoc } from "@/components/document/configs";

export const dynamic = "force-dynamic";

export default async function SkillDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const s = await skills.get((await params).id).catch(() => notFound());
  return (
    <RecordDocument
      {...skillDoc}
      id={s.id}
      updatedAt={null}
      values={{
        name: s.name,
        category: s.category,
        level: s.level,
        icon: s.icon,
        order: s.order,
      }}
    />
  );
}
