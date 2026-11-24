import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { skills } from "@/lib/content";
import { DataTable, type Column } from "@/components/database/data-table";

export const dynamic = "force-dynamic";

const columns: Column[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    primary: true,
    required: true,
    width: "w-[30%]",
  },
  {
    key: "category",
    label: "Category",
    type: "select",
    required: true,
    width: "w-40",
    options: [
      { value: "LANGUAGE", label: "Language" },
      { value: "FRAMEWORK", label: "Framework" },
      { value: "DATABASE", label: "Database" },
      { value: "DEVOPS", label: "DevOps" },
      { value: "TOOL", label: "Tool" },
      { value: "OTHER", label: "Other" },
    ],
  },
  {
    key: "level",
    label: "Level (0 to 100)",
    type: "number",
    min: 0,
    max: 100,
    width: "w-36",
  },
  { key: "order", label: "Order", type: "number", min: 0, width: "w-20" },
];

export default async function SkillsPage() {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const rows = (await skills.list()).map((s) => ({
    id: s.id,
    updatedAt: null,
    href: `/dashboard/skills/${s.id}/edit`,
    values: {
      name: s.name,
      category: s.category,
      level: s.level,
      order: s.order,
    },
  }));
  return (
    <DataTable
      resource="skills"
      title="Skills"
      description="Type a name in the last row to add a skill. Certifications link to these."
      columns={columns}
      rows={rows}
      newLabel="New skill"
      groupable={["category"]}
      defaultGroup="category"
    />
  );
}
