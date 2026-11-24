import { getPrimaryCv } from "@/lib/cv";
import { pdfResponse } from "@/lib/pdf-response";

export const revalidate = 300;

export async function GET(req: Request) {
  const download = new URL(req.url).searchParams.has("download");
  return pdfResponse(await getPrimaryCv(), download);
}
