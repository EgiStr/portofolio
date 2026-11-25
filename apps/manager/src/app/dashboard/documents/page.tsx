import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { listDocuments } from "@ecosystem/cv-core/documents";
import { authOptions } from "@/lib/auth";
import { DocumentLibrary } from "@/components/documents/library";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const rows = await listDocuments();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Diplomas, transcripts and certificates. Files are private: they are
          stored in a private bucket and opened through links that expire after
          five minutes. Attach them to an application from its page.
        </p>
      </div>
      <DocumentLibrary
        docs={rows.map((d) => ({
          id: d.id,
          kind: d.kind,
          title: d.title,
          fileName: d.fileName,
          sizeBytes: d.sizeBytes,
          attachedTo: d._count.applications,
        }))}
      />
    </div>
  );
}
