import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { experiences } from "@/lib/content";
import { DataTable, type Column } from "@/components/database/data-table";

export const dynamic = "force-dynamic";

const columns: Column[] = [
  {
    key: "position",
    label: "Position",
    type: "text",
    primary: true,
    required: true,
    width: "w-[24%]",
  },
  {
    key: "company",
    label: "Company",
    type: "text",
    required: true,
    width: "w-[20%]",
  },
  { key: "location", label: "Location", type: "text" },
  {
    key: "startDate",
    label: "Start",
    type: "date",
    required: true,
    width: "w-32",
  },
  { key: "endDate", label: "End", type: "date", width: "w-32" },
  { key: "current", label: "Current", type: "checkbox", width: "w-24" },
  { key: "order", label: "Order", type: "number", min: 0, width: "w-20" },
];

export default async function ExperiencesPage() {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const rows = (await experiences.list()).map((e) => ({
    id: e.id,
    updatedAt: e.updatedAt.toISOString(),
    href: `/dashboard/experiences/${e.id}/edit`,
    values: {
      position: e.position,
      company: e.company,
      location: e.location,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString() ?? null,
      current: e.current,
      order: e.order,
    },
  }));
  return (
    <DataTable
      resource="experiences"
      title="Experience"
      description="Roles shown in the experience section, in this order."
      columns={columns}
      rows={rows}
      newHref="/dashboard/experiences/new"
      newLabel="New role"
      groupable={["current"]}
    />
  );
}
