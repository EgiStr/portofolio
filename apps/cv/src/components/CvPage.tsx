import type { LoadedCv } from "@/lib/cv";
import { MAIN_SITE_URL, SITE_URL } from "@/lib/cv";
import { CvView } from "./CvView";

/** Toolbar, schema.org data and the CV itself. */
/** `cv` must come from forWeb(), which has already removed the phone when the style hides it. */
export function CvPage({
  cv,
  pdfPath,
}: {
  cv: LoadedCv & { phoneInPdf: boolean };
  pdfPath: string;
}) {
  const hasPhone = cv.phoneInPdf;
  const h = cv.content.header;
  const updated = cv.row.updatedAt.toISOString().slice(0, 10);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: h.name,
    jobTitle: h.headline,
    email: h.email ? `mailto:${h.email}` : undefined,
    address: h.location
      ? { "@type": "PostalAddress", addressLocality: h.location }
      : undefined,
    url: SITE_URL,
    sameAs: h.links.map((l) => l.url),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="bar" aria-label="CV actions">
        <a className="brand" href={MAIN_SITE_URL}>
          eggisatria<span>.my.id</span>
        </a>
        <div className="actions">
          <a
            className="btn ghost"
            href={pdfPath}
            target="_blank"
            rel="noopener"
          >
            View PDF
          </a>
          <a className="btn" href={`${pdfPath}?download`}>
            Download PDF
          </a>
        </div>
      </nav>
      <main className="wrap">
        <CvView content={cv.content} style={cv.style} />
        <p className="foot">
          Updated {updated}. The PDF is single-column text that applicant
          tracking systems can read
          {hasPhone && !cv.style.showPhoneOnWeb
            ? ", and it includes the phone number"
            : ""}
          .
        </p>
      </main>
    </>
  );
}
