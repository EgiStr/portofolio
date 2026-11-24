/**
 * Upsert a CV version from a JSON file kept outside the repo (it holds the phone number).
 *   pnpm --filter @ecosystem/cv seed <path-to.json>
 * JSON: { slug, title, kind, targetRole?, isPublic?, isPrimary?, style?, content }
 */
import { readFileSync } from "node:fs";
import { prisma } from "@ecosystem/database";
import { CvContentSchema, CvStyleSchema, atsCheck } from "@ecosystem/cv-core";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: seed <path-to.json>");
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const content = CvContentSchema.parse(raw.content);
  const style = CvStyleSchema.parse(raw.style ?? {});
  const atsScore = atsCheck(content).score;
  const data = {
    title: raw.title,
    kind: raw.kind ?? "TAILORED",
    targetRole: raw.targetRole ?? null,
    company: raw.company ?? null,
    content,
    style,
    atsScore,
    isPublic: !!raw.isPublic,
    isPrimary: !!raw.isPrimary,
    createdBy: "seed",
  };
  if (data.isPrimary)
    await prisma.cvVersion.updateMany({
      where: { isPrimary: true, NOT: { slug: raw.slug } },
      data: { isPrimary: false },
    });
  const row = await prisma.cvVersion.upsert({
    where: { slug: raw.slug },
    create: { slug: raw.slug, ...data },
    update: data,
  });
  console.log(`saved ${row.slug} (${row.id}), ATS score ${atsScore}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
