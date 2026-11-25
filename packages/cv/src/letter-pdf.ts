import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { CreateElement } from "./pdf";
import type { CvStyle } from "./schema";
import { defaultStyle } from "./schema";
import type { LetterContent } from "./letter";

/**
 * The cover letter as a text-based PDF, one A4 page of plain business letter.
 * Same createElement injection as pdf.ts (see the note there), and the same
 * font, size and margin settings as the CV so the two read as one set.
 */

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
      paddingTop: s.margin * 0.9,
      paddingBottom: s.margin * 0.9,
      paddingHorizontal: s.margin,
    },
    name: { fontSize: base * 1.6, fontWeight: "bold", lineHeight: 1.1 },
    headline: { marginTop: 2, color: GREY },
    contact: { marginTop: 2, color: GREY },
    link: { color: LINK, textDecoration: "none" },
    rule: {
      marginTop: base * 0.8,
      borderBottomWidth: 0.6,
      borderBottomColor: GREY,
    },
    block: { marginTop: base * 1.2 },
    bold: { fontWeight: "bold" },
    para: { marginTop: base * 0.7 },
  });
}

export interface LetterPdfProps {
  content: LetterContent;
  style?: CvStyle;
  title?: string;
}

export function createLetterPdfElement(
  h: CreateElement,
  { content, style = defaultStyle, title }: LetterPdfProps,
) {
  const st = makeStyles(style);
  const s = content.sender;
  const to = content.recipient;

  const joined = (parts: unknown[]) =>
    parts.flatMap((p, i) => (i === 0 ? [p] : [" | ", p]));
  const line1: unknown[] = [s.location, s.phone].filter(Boolean);
  if (s.email)
    line1.push(
      h(
        Link,
        { key: "email", src: `mailto:${s.email}`, style: st.link },
        s.email,
      ),
    );
  const line2 = s.links.map((l) =>
    h(Link, { key: l.url, src: l.url, style: st.link }, l.label),
  );

  const addressee = [to.name, to.title, to.company, to.address].filter(Boolean);

  return h(
    Document,
    {
      title: title ?? `${s.name} - Cover letter`,
      author: s.name,
      subject: content.subject ?? `Application to ${to.company}`,
      creator: "cv.eggisatria.my.id",
      producer: "cv.eggisatria.my.id",
    },
    h(
      Page,
      { size: "A4", style: st.page },
      h(Text, { style: st.name }, s.name),
      s.headline ? h(Text, { style: st.headline }, s.headline) : null,
      line1.length ? h(Text, { style: st.contact }, ...joined(line1)) : null,
      line2.length ? h(Text, null, ...joined(line2)) : null,
      h(View, { style: st.rule }),
      content.date ? h(Text, { style: st.block }, content.date) : null,
      h(
        View,
        { style: st.block },
        ...addressee.map((line, i) => h(Text, { key: i }, line)),
      ),
      content.subject
        ? h(Text, { style: [st.block, st.bold] }, content.subject)
        : null,
      h(Text, { style: st.block }, content.salutation),
      ...content.paragraphs
        .filter((p) => p.trim())
        .map((p, i) => h(Text, { key: i, style: st.para }, p)),
      h(Text, { style: st.block }, content.closing),
      h(
        Text,
        { style: [{ marginTop: style.fontSize * 2.2 }, st.bold] },
        content.signature,
      ),
    ),
  );
}
