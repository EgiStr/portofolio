import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { projects } from "@/lib/content";
import { DataTable, type Column } from "@/components/database/data-table";

export const dynamic = "force-dynamic";

const columns: Column[] = [
  {
    key: "title",
    label: "Title",
    type: "text",
    primary: true,
    required: true,
    width: "w-[28%]",
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    required: true,
    width: "w-32",
    options: [
      { value: "PUBLISHED", label: "Published", tone: "accent" },
      { value: "DRAFT", label: "Draft" },
      { value: "ARCHIVED", label: "Archived" },
    ],
  },
  { key: "featured", label: "Featured", type: "checkbox", width: "w-24" },
  { key: "techStack", label: "Tech stack", type: "tags" },
  {
    key: "displayOrder",
    label: "Order",
    type: "number",
    min: 0,
    width: "w-20",
  },
  { key: "clicks", label: "Clicks", type: "readonly", width: "w-20" },
];

export default async function ProjectsPage() {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const rows = (await projects.list()).map((p) => ({
    id: p.id,
    updatedAt: p.updatedAt.toISOString(),
    href: `/dashboard/projects/${p.id}/edit`,
    values: {
      title: p.title,
      status: p.status,
      featured: p.featured,
      techStack: p.techStack.map((t) => t.name),
      displayOrder: p.displayOrder,
      clicks: p.clicks,
    },
  }));
  return (
    <DataTable
      resource="projects"
      title="Projects"
      description="Portfolio projects shown on the landing page. The landing page picks up changes within a minute."
      columns={columns}
      rows={rows}
      newHref="/dashboard/projects/new"
      newLabel="New project"
      groupable={["status", "featured"]}
    />
  );
}
