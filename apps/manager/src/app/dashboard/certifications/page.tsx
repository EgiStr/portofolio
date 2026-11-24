import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { certifications } from "@/lib/content";
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
    key: "organization",
    label: "Issuer",
    type: "text",
    required: true,
    width: "w-[18%]",
  },
  {
    key: "category",
    label: "Category",
    type: "select",
    required: true,
    width: "w-44",
    options: [
      { value: "MACHINE_LEARNING", label: "Machine learning" },
      { value: "CLOUD_COMPUTING", label: "Cloud computing" },
      { value: "DATA_ANALYTICS", label: "Data analytics" },
      { value: "WEB_DEVELOPMENT", label: "Web development" },
      { value: "MOBILE_DEVELOPMENT", label: "Mobile development" },
      { value: "DEVOPS", label: "DevOps" },
      { value: "CYBERSECURITY", label: "Cybersecurity" },
      { value: "DATABASE", label: "Database" },
      { value: "OTHER", label: "Other" },
    ],
  },
  {
    key: "issueDate",
    label: "Issued",
    type: "date",
    required: true,
    width: "w-32",
  },
  // Linked skills are edited on the record page, where the picker lives.
  { key: "skills", label: "Skills", type: "tags", locked: true },
  {
    key: "displayOrder",
    label: "Order",
    type: "number",
    min: 0,
    width: "w-20",
  },
];

export default async function CertificationsPage() {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const rows = (await certifications.list()).map((c) => ({
    id: c.id,
    updatedAt: c.updatedAt.toISOString(),
    href: `/dashboard/certifications/${c.id}/edit`,
    values: {
      name: c.name,
      organization: c.organization,
      category: c.category,
      issueDate: c.issueDate.toISOString(),
      skills: c.skills.map((s) => s.skill.name),
      displayOrder: c.displayOrder,
    },
  }));
  return (
    <DataTable
      resource="certifications"
      title="Certifications"
      description="Certificates shown on the landing page."
      columns={columns}
      rows={rows}
      newHref="/dashboard/certifications/new"
      newLabel="New certification"
      groupable={["category"]}
    />
  );
}
