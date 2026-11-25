import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MAIN_SITE_URL } from "@/lib/cv";
import { getPublicLetter } from "@/lib/letter";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const letter = await getPublicLetter((await params).slug);
  if (!letter) return {};
  return {
    title: letter.row.title,
    alternates: { canonical: `/letter/${letter.row.slug}` },
    robots: { index: false },
  };
}

export default async function LetterPage({ params }: Props) {
  const { slug } = await params;
  const letter = await getPublicLetter(slug);
  if (!letter) notFound();
  const { content: c, style } = letter;
  const s = c.sender;
  // The phone stays in the PDF only, like the CV page.
  const contact = [
    s.location,
    style.showPhoneOnWeb ? s.phone : undefined,
  ].filter(Boolean) as string[];
  const to = [c.recipient.name, c.recipient.title, c.recipient.company].filter(
    Boolean,
  ) as string[];
  const pdf = `/letter/${slug}/pdf`;

  return (
    <>
      <nav className="bar" aria-label="Letter actions">
        <a className="brand" href={MAIN_SITE_URL}>
          eggisatria<span>.my.id</span>
        </a>
        <div className="actions">
          <a className="btn ghost" href={pdf} target="_blank" rel="noopener">
            View PDF
          </a>
          <a className="btn" href={`${pdf}?download`}>
            Download PDF
          </a>
        </div>
      </nav>
      <main className="wrap">
        <article
          className="paper letter"
          aria-label={`Cover letter of ${s.name}`}
        >
          <header className="cv-head">
            <h1>{s.name}</h1>
            {s.headline ? <p className="headline">{s.headline}</p> : null}
            <p className="contact">
              {contact.map((x) => (
                <span key={x}>{x}</span>
              ))}
              {s.email ? (
                <span>
                  <a href={`mailto:${s.email}`}>{s.email}</a>
                </span>
              ) : null}
              {s.links.map((l) => (
                <span key={l.url}>
                  <a href={l.url}>{l.label}</a>
                </span>
              ))}
            </p>
          </header>
          {c.date ? <p className="l-block">{c.date}</p> : null}
          <p className="l-block">
            {to.map((line) => (
              <span key={line} className="l-line">
                {line}
              </span>
            ))}
          </p>
          {c.subject ? (
            <p className="l-block">
              <strong>{c.subject}</strong>
            </p>
          ) : null}
          <p className="l-block">{c.salutation}</p>
          {c.paragraphs
            .filter((p) => p.trim())
            .map((p, i) => (
              <p key={i} className="l-para">
                {p}
              </p>
            ))}
          <p className="l-block">{c.closing}</p>
          <p className="l-sign">
            <strong>{c.signature}</strong>
          </p>
        </article>
      </main>
    </>
  );
}
