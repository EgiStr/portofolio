import { createRequire } from "node:module";
import { renderToBuffer } from "@react-pdf/renderer";
import { createCvPdfElement, type CreateElement, type CvPdfProps } from "./pdf";
import { createLetterPdfElement, type LetterPdfProps } from "./letter-pdf";

declare const __non_webpack_require__: NodeJS.Require | undefined;

/**
 * Server-only: render the CV to PDF bytes.
 *
 * Next loads @react-pdf/renderer from node_modules (it is on Next's default
 * external list), so the element tree must come from that same React. A
 * runtime require skips the bundler's React; plain Node (tsx scripts) uses
 * createRequire.
 */
function nodeReact(): { createElement: CreateElement } {
  const req =
    typeof __non_webpack_require__ === "function"
      ? __non_webpack_require__
      : createRequire(import.meta.url);
  return req("react");
}

export async function renderCvPdf(props: CvPdfProps): Promise<Buffer> {
  const el = createCvPdfElement(nodeReact().createElement, props);
  return renderToBuffer(el);
}

export async function renderLetterPdf(props: LetterPdfProps): Promise<Buffer> {
  const el = createLetterPdfElement(nodeReact().createElement, props);
  return renderToBuffer(el);
}
