import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CvPage } from "@/components/CvPage";
import { forWeb, getPublicCv } from "@/lib/cv";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cv = await getPublicCv((await params).slug);
  if (!cv) return {};
  return {
    title: cv.row.title,
    alternates: { canonical: `/v/${cv.row.slug}` },
    robots: { index: false },
  };
}

export default async function Version({ params }: Props) {
  const cv = await getPublicCv((await params).slug);
  if (!cv) notFound();
  return <CvPage cv={forWeb(cv)} pdfPath={`/v/${cv.row.slug}/pdf`} />;
}
