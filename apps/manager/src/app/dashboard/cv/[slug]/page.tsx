import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadCvAction } from "@/actions/cv";
import { CvEditor } from "@/components/cv/cv-editor";

export const dynamic = "force-dynamic";

export default async function CvEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // The dashboard layout only guards on the client; the CV data must not reach an anonymous RSC payload.
  if (!(await getServerSession(authOptions))) redirect("/login");
  const { slug } = await params;
  const r = await loadCvAction(slug);
  if (!r.ok) notFound();
  return (
    <CvEditor
      initial={r.data}
      cvUrl={process.env.NEXT_PUBLIC_CV_URL || "https://cv.eggisatria.my.id"}
    />
  );
}
