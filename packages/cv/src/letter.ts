import { z } from "zod";
import {
  CvStyleSchema,
  HeaderSchema,
  defaultStyle,
  parseStyle,
} from "./schema";
import type { CvHeader, CvStyle } from "./schema";

/**
 * Shape of a cover letter stored in `cover_letters.content`. It reuses the CV
 * header and style, so the letter and the CV sent with it look like one set.
 */

export const LetterRecipientSchema = z.object({
  name: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  company: z.string().min(1).max(120),
  address: z.string().max(200).optional(),
});

export const LetterContentSchema = z.object({
  sender: HeaderSchema,
  /** Printed as written, e.g. "24 November 2026". */
  date: z.string().max(60).optional(),
  recipient: LetterRecipientSchema,
  subject: z.string().max(200).optional(),
  salutation: z.string().max(120),
  paragraphs: z.array(z.string().max(1500)).min(1).max(8),
  closing: z.string().max(80).default("Sincerely,"),
  signature: z.string().min(1).max(100),
});

export type LetterContent = z.infer<typeof LetterContentSchema>;
export type LetterRecipient = z.infer<typeof LetterRecipientSchema>;

export const LetterStyleSchema = CvStyleSchema;
export type LetterStyle = CvStyle;
export const defaultLetterStyle: LetterStyle = defaultStyle;
export const parseLetterStyle = parseStyle;

/** Empty letter for a company, with the sender taken from a CV header. */
export function blankLetter(
  sender: CvHeader,
  company: string,
  role?: string | null,
): LetterContent {
  return {
    sender,
    recipient: { company },
    subject: role ? `Application for ${role}` : undefined,
    salutation: "Dear Hiring Team,",
    paragraphs: [""],
    closing: "Sincerely,",
    signature: sender.name,
  };
}

/** The letter as plain text, in reading order, for ATS-style checks and previews. */
export function letterText(c: LetterContent): string {
  const to = [c.recipient.name, c.recipient.title, c.recipient.company]
    .filter(Boolean)
    .join(", ");
  return [
    c.date,
    to,
    c.subject ? `Subject: ${c.subject}` : "",
    c.salutation,
    ...c.paragraphs,
    c.closing,
    c.signature,
  ]
    .filter((x) => x && x.trim())
    .join("\n\n");
}
