import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadLetterContext } from "@/actions/letters";
import { LetterEditor } from "@/components/letters/letter-editor";

export const dynamic = "force-dynamic";

export default async function LetterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await getServerSession(authOptions))) redirect("/login");
  const { slug } = await params;
  const ctx = await loadLetterContext(slug).catch(() => null);
  if (!ctx) notFound();
  return <LetterEditor initial={ctx} />;
}
