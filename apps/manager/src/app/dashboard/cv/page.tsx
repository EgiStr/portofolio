import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { listVersions } from "@ecosystem/cv-core/store";
import { Badge } from "@ecosystem/ui";
import { STAGE_LABEL } from "@ecosystem/cv-core";
import { authOptions } from "@/lib/auth";
import { NewVersionForm } from "@/components/cv/new-version-form";
import { DeleteVersionButton } from "@/components/cv/delete-version-button";

export const dynamic = "force-dynamic";

export default async function CvStudioPage() {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const rows = await listVersions();
  const cvUrl = process.env.NEXT_PUBLIC_CV_URL || "https://cv.eggisatria.my.id";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CV Studio</h1>
        <p className="text-muted-foreground">
          One master CV and tailored copies, grouped by application in the Job
          Tracker. The primary version is live at{" "}
          <a
            className="underline underline-offset-4"
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {cvUrl.replace(/^https?:\/\//, "")}
          </a>
          . Agents use the same data through{" "}
          <code className="text-xs">{cvUrl}/api/mcp</code>.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Version</th>
              <th className="p-3 font-medium">Target</th>
              <th className="p-3 text-right font-medium">ATS</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Updated</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <Link
                    href={`/dashboard/cv/${r.slug}`}
                    className="font-medium hover:underline"
                  >
                    {r.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">{r.slug}</div>
                </td>
                <td className="p-3">
                  {[r.targetRole, r.company].filter(Boolean).join(" at ") ||
                    "None"}
                  {r.application ? (
                    <Link
                      href={`/dashboard/applications/${r.application.id}`}
                      className="block text-xs text-muted-foreground hover:underline"
                    >
                      {STAGE_LABEL[r.application.stage]} in Job Tracker
                    </Link>
                  ) : null}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {r.atsScore ?? "None"}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {r.isPrimary ? <Badge>Primary</Badge> : null}
                    <Badge variant={r.isPublic ? "secondary" : "outline"}>
                      {r.isPublic ? "Public" : "Private"}
                    </Badge>
                    {r.brainNotePath ? (
                      <Badge variant="outline">In brain</Badge>
                    ) : null}
                  </div>
                </td>
                <td className="whitespace-nowrap p-3 text-muted-foreground">
                  {r.updatedAt.toISOString().slice(0, 10)}
                </td>
                <td className="p-3 text-right">
                  {r.isPrimary ? null : (
                    <DeleteVersionButton slug={r.slug} title={r.title} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewVersionForm
        bases={rows.map((r) => ({
          slug: r.slug,
          title: r.title,
          isPrimary: r.isPrimary,
        }))}
      />
    </div>
  );
}
