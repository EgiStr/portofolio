import { renderCvPdf } from "@ecosystem/cv-core/pdf-server";
import { pdfFileName, type LoadedCv } from "./cv";

export async function pdfResponse(
  cv: LoadedCv | null,
  download: boolean,
): Promise<Response> {
  if (!cv) return new Response("CV not found", { status: 404 });
  const bytes = await renderCvPdf({
    content: cv.content,
    style: cv.style,
    title: cv.row.title,
  });
  const name = pdfFileName(cv.content, cv.row.slug);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
