import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CvPage } from "@/components/CvPage";
import { forWeb, getPrimaryCv } from "@/lib/cv";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const cv = await getPrimaryCv();
  if (!cv) return {};
  const h = cv.content.header;
  const summary = cv.content.sections.find((s) => s.type === "paragraph")?.text;
  return {
    title: { absolute: `${h.name} | ${h.headline ?? "CV"}` },
    description: summary?.slice(0, 160),
  };
}

export default async function Home() {
  const cv = await getPrimaryCv();
  if (!cv) notFound();
  return <CvPage cv={forWeb(cv)} pdfPath="/pdf" />;
}
