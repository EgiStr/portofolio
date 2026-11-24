import { getPublicCv } from "@/lib/cv";
import { pdfResponse } from "@/lib/pdf-response";

export const revalidate = 300;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const download = new URL(req.url).searchParams.has("download");
  return pdfResponse(await getPublicCv(slug), download);
}
