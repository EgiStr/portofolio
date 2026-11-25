import { prisma, type CoverLetter } from "@ecosystem/database";
import {
  LetterContentSchema,
  parseLetterStyle,
  type CvStyle,
  type LetterContent,
} from "@ecosystem/cv-core";

export interface LoadedLetter {
  row: CoverLetter;
  content: LetterContent;
  style: CvStyle;
}

/** A cover letter by slug, only when it is public. */
export async function getPublicLetter(
  slug: string,
): Promise<LoadedLetter | null> {
  const row = await prisma.coverLetter.findFirst({
    where: { slug, isPublic: true },
  });
  if (!row) return null;
  const parsed = LetterContentSchema.safeParse(row.content);
  if (!parsed.success) {
    console.error(
      `cover_letters ${row.id} has invalid content`,
      parsed.error.issues.slice(0, 3),
    );
    return null;
  }
  return { row, content: parsed.data, style: parseLetterStyle(row.style) };
}

export function letterFileName(content: LetterContent, slug: string) {
  const name = content.sender.name.replace(/[^\w]+/g, "_");
  return `Cover_Letter_${name}_${slug}.pdf`;
}
