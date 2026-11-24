import {
  Document,
  Font,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Bullet, CvContent, CvStyle, Entry } from "./schema";
import { defaultStyle, visibleSections } from "./schema";

/**
 * The CV as a text-based PDF (selectable text, one column, standard fonts).
 *
 * Elements are built with a `createElement` passed in by the caller instead of
 * JSX. Next externalizes @react-pdf/renderer on the server, so react-pdf runs
 * on node_modules React while JSX in a route handler would use Next's bundled
 * React; elements from one are not valid children for the other. The server
 * passes node_modules React (see pdf-server.ts); a browser passes its own.
 */

// Words must never be split with a hyphen: ATS parsers would read "engi-neer".
Font.registerHyphenationCallback((word) => [word]);

// Loose on purpose: React 18 and 19 type their createElement differently.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CreateElement = (type: any, props?: any, ...children: any[]) => any;

const INK = "#1F1F1F";
const GREY = "#444444";
const LINK = "#0B4F9C";

function makeStyles(s: CvStyle) {
  const base = s.fontSize;
  return StyleSheet.create({
    page: {
      fontFamily: s.font,
      fontSize: base,
      lineHeight: s.lineHeight,
      color: INK,
      paddingTop: s.margin * 0.8,
      paddingBottom: s.margin * 0.8,
      paddingHorizontal: s.margin,
    },
    name: { fontSize: base * 1.9, fontWeight: "bold", lineHeight: 1.1 },
    headline: { fontSize: base * 1.15, fontWeight: "bold", marginTop: 2 },
    contact: { marginTop: 3 },
    link: { color: LINK, textDecoration: "none" },
    heading: {
      fontSize: base * 1.05,
      fontWeight: "bold",
      marginTop: base * 0.8,
      marginBottom: base * 0.3,
      paddingBottom: 1,
      borderBottomWidth: 0.6,
      borderBottomColor: GREY,
    },
    entry: { marginTop: base * 0.45 },
    title: { fontWeight: "bold" },
    meta: { fontStyle: "italic", color: GREY },
    bulletRow: { flexDirection: "row", marginTop: 1 },
    bulletDot: { width: base * 1.2, paddingLeft: base * 0.3 },
    bulletText: { flex: 1 },
    lead: { fontWeight: "bold" },
  });
}

export interface CvPdfProps {
  content: CvContent;
  style?: CvStyle;
  title?: string;
}

/** Build the <Document> element tree for react-pdf. */
export function createCvPdfElement(
  h: CreateElement,
  { content, style = defaultStyle, title }: CvPdfProps,
) {
  const st = makeStyles(style);
  const hd = content.header;

  const bullet = (b: Bullet, key: string | number) =>
    h(
      View,
      { key, style: st.bulletRow },
      h(Text, { style: st.bulletDot }, "•"),
      h(
        Text,
        { style: st.bulletText },
        b.lead ? h(Text, { style: st.lead }, `${b.lead} `) : null,
        b.text,
      ),
    );

  const entry = (e: Entry) =>
    h(
      View,
      { key: e.id, style: st.entry },
      // Keep the title, meta line and first bullet on one page.
      h(
        View,
        { wrap: false },
        h(Text, { style: st.title }, e.title),
        e.meta ? h(Text, { style: st.meta }, e.meta) : null,
        e.bullets[0] ? bullet(e.bullets[0], 0) : null,
      ),
      ...e.bullets.slice(1).map((b, i) => bullet(b, i + 1)),
    );

  // Parts are joined with " | " as separate text runs so a parser reads them in order.
  const joined = (parts: unknown[]) =>
    parts.flatMap((p, i) => (i === 0 ? [p] : [" | ", p]));
  const line1: unknown[] = [hd.location, hd.phone].filter(Boolean);
  if (hd.email)
    line1.push(
      h(
        Link,
        { key: "email", src: `mailto:${hd.email}`, style: st.link },
        hd.email,
      ),
    );
  const line2 = hd.links.map((l) =>
    h(Link, { key: l.url, src: l.url, style: st.link }, l.label),
  );

  return h(
    Document,
    {
      title: title ?? `${hd.name} - CV`,
      author: hd.name,
      subject: hd.headline,
      creator: "cv.eggisatria.my.id",
      producer: "cv.eggisatria.my.id",
    },
    h(
      Page,
      { size: "A4", style: st.page },
      h(Text, { style: st.name }, hd.name),
      hd.headline ? h(Text, { style: st.headline }, hd.headline) : null,
      h(Text, { style: st.contact }, ...joined(line1)),
      line2.length ? h(Text, null, ...joined(line2)) : null,
      ...visibleSections(content).map((s) =>
        h(
          View,
          { key: s.id },
          h(
            Text,
            { style: st.heading, minPresenceAhead: 40 },
            s.title.toUpperCase(),
          ),
          s.type === "paragraph" && s.text ? h(Text, null, s.text) : null,
          ...(s.entries ?? []).map(entry),
          ...(s.items ?? []).map((b, i) => bullet(b, i)),
        ),
      ),
    ),
  );
}
