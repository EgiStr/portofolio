import {
  visibleSections,
  type Bullet,
  type CvContent,
  type CvStyle,
} from "@ecosystem/cv-core";

function BulletItem({ b }: { b: Bullet }) {
  return (
    <li>
      {b.lead ? <strong>{b.lead} </strong> : null}
      {b.text}
    </li>
  );
}

/**
 * The CV as semantic HTML: one <article>, real headings, lists and links, so
 * that a parser reading the web page gets the same order as the PDF.
 */
export function CvView({
  content,
  style,
}: {
  content: CvContent;
  style: CvStyle;
}) {
  const h = content.header;
  const contact = [
    h.location,
    style.showPhoneOnWeb ? h.phone : undefined,
  ].filter(Boolean) as string[];

  return (
    <article className="paper" aria-label={`CV of ${h.name}`}>
      <header className="cv-head">
        <h1>{h.name}</h1>
        {h.headline ? <p className="headline">{h.headline}</p> : null}
        <p className="contact">
          {contact.map((c) => (
            <span key={c}>{c}</span>
          ))}
          {h.email ? (
            <span>
              <a href={`mailto:${h.email}`}>{h.email}</a>
            </span>
          ) : null}
        </p>
        {h.links.length ? (
          <p className="contact">
            {h.links.map((l) => (
              <span key={l.url}>
                <a href={l.url} rel="me noopener" target="_blank">
                  {l.label}
                </a>
              </span>
            ))}
          </p>
        ) : null}
      </header>

      {visibleSections(content).map((s) => (
        <section key={s.id} aria-labelledby={`s-${s.id}`}>
          <h2 id={`s-${s.id}`}>{s.title}</h2>
          {s.type === "paragraph" && s.text ? <p>{s.text}</p> : null}
          {s.entries?.map((e) => (
            <div key={e.id} className="entry">
              <h3>{e.title}</h3>
              {e.meta ? <p className="meta">{e.meta}</p> : null}
              {e.bullets.length ? (
                <ul>
                  {e.bullets.map((b, i) => (
                    <BulletItem key={i} b={b} />
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          {s.items?.length ? (
            <ul>
              {s.items.map((b, i) => (
                <BulletItem key={i} b={b} />
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}
