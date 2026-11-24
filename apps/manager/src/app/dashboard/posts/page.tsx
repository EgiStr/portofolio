import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { posts } from "@/lib/content";
import { DataTable, type Column } from "@/components/database/data-table";

export const dynamic = "force-dynamic";

const columns: Column[] = [
  {
    key: "title",
    label: "Title",
    type: "text",
    primary: true,
    required: true,
    width: "w-[34%]",
  },
  { key: "published", label: "Published", type: "checkbox", width: "w-24" },
  { key: "tags", label: "Tags", type: "tags" },
  { key: "readingTime", label: "Read (min)", type: "readonly", width: "w-24" },
  { key: "views", label: "Views", type: "readonly", width: "w-20" },
  { key: "edited", label: "Edited", type: "date", locked: true, width: "w-32" },
];

export default async function PostsPage() {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const rows = (await posts.list()).map((p) => ({
    id: p.id,
    updatedAt: p.updatedAt.toISOString(),
    href: `/dashboard/posts/${p.id}/edit`,
    values: {
      title: p.title,
      published: p.published,
      tags: p.tags.map((t) => t.name),
      readingTime: p.readingTime,
      views: p._count.views,
      edited: p.updatedAt.toISOString(),
    },
  }));
  return (
    <DataTable
      resource="posts"
      title="Posts"
      description="Blog posts. Open a post to edit its body."
      columns={columns}
      rows={rows}
      newHref="/dashboard/posts/new"
      newLabel="New post"
      groupable={["published"]}
    />
  );
}
