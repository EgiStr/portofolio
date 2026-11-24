import { prisma, type CvVersion } from "@ecosystem/database";
import {
  CvContentSchema,
  parseStyle,
  type CvContent,
  type CvStyle,
} from "@ecosystem/cv-core";

export const SITE_URL =
  process.env.NEXT_PUBLIC_CV_URL ?? "https://cv.eggisatria.my.id";
export const MAIN_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.eggisatria.my.id";

export interface LoadedCv {
  row: CvVersion;
  content: CvContent;
  style: CvStyle;
}

function load(row: CvVersion | null): LoadedCv | null {
  if (!row) return null;
  const parsed = CvContentSchema.safeParse(row.content);
  if (!parsed.success) {
    console.error(
      `cv_versions ${row.id} has invalid content`,
      parsed.error.issues.slice(0, 3),
    );
    return null;
  }
  return { row, content: parsed.data, style: parseStyle(row.style) };
}

/** The public master CV shown at the site root. */
export async function getPrimaryCv(): Promise<LoadedCv | null> {
  const row = await prisma.cvVersion.findFirst({
    where: { isPrimary: true, isPublic: true },
    orderBy: { updatedAt: "desc" },
  });
  return load(row);
}

/** A version by slug, only when it is public. */
export async function getPublicCv(slug: string): Promise<LoadedCv | null> {
  const row = await prisma.cvVersion.findFirst({
    where: { slug, isPublic: true },
  });
  return load(row);
}

export async function listPublicCvs() {
  return prisma.cvVersion.findMany({
    where: { isPublic: true },
    select: { slug: true, title: true, isPrimary: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function pdfFileName(content: CvContent, slug: string): string {
  const name = content.header.name.replace(/[^\w]+/g, "_");
  return `CV_${name}_${slug}.pdf`;
}

/**
 * Copy for the HTML page: drops the phone unless the style allows it, so the
 * number cannot reach the page or the RSC payload. The PDF keeps it.
 */
export function forWeb(cv: LoadedCv): LoadedCv & { phoneInPdf: boolean } {
  const phoneInPdf = !!cv.content.header.phone;
  // The raw row repeats the content and holds the private job description: blank both.
  const row = {
    ...cv.row,
    content: {},
    jobDescription: null,
    brainNotePath: null,
  };
  if (cv.style.showPhoneOnWeb) return { ...cv, row, phoneInPdf };
  return {
    ...cv,
    row,
    phoneInPdf,
    content: {
      ...cv.content,
      header: { ...cv.content.header, phone: undefined },
    },
  };
}
