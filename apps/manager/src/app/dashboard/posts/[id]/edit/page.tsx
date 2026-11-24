import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { posts } from "@/lib/content";
import { RecordDocument } from "@/components/document/record-document";
import { postDoc } from "@/components/document/configs";

export const dynamic = "force-dynamic";

export default async function PostDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const p = await posts.get((await params).id).catch(() => notFound());
  return (
    <RecordDocument
      {...postDoc}
      id={p.id}
      updatedAt={p.updatedAt.toISOString()}
      values={{
        title: p.title,
        slug: p.slug,
        published: p.published,
        tags: p.tags.map((t) => t.name),
        excerpt: p.excerpt,
        content: p.content,
        coverImage: p.coverImage,
      }}
    />
  );
}
