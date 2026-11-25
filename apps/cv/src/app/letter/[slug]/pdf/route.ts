import { renderLetterPdf } from "@ecosystem/cv-core/pdf-server";
import { getPublicLetter, letterFileName } from "@/lib/letter";

export const revalidate = 300;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const letter = await getPublicLetter(slug);
  if (!letter) return new Response("Letter not found", { status: 404 });
  const download = new URL(req.url).searchParams.has("download");
  const bytes = await renderLetterPdf({
    content: letter.content,
    style: letter.style,
    title: letter.row.title,
  });
  const name = letterFileName(letter.content, slug);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
