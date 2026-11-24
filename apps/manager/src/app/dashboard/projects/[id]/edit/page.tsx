import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { projects } from "@/lib/content";
import { RecordDocument } from "@/components/document/record-document";
import { projectDoc } from "@/components/document/configs";

export const dynamic = "force-dynamic";

export default async function ProjectDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const p = await projects.get((await params).id).catch(() => notFound());
  return (
    <RecordDocument
      {...projectDoc}
      id={p.id}
      updatedAt={p.updatedAt.toISOString()}
      values={{
        title: p.title,
        slug: p.slug,
        status: p.status,
        featured: p.featured,
        techStack: p.techStack.map((t) => t.name),
        liveUrl: p.liveUrl,
        githubUrl: p.githubUrl,
        displayOrder: p.displayOrder,
        description: p.description,
        longDescription: p.longDescription,
        imageUrl: p.imageUrl,
      }}
    />
  );
}
