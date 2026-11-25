import { describe, expect, it } from "vitest";
import {
  LetterContentSchema,
  blankLetter,
  letterCheck,
  letterText,
  type LetterContent,
} from "./index";

const sender = { name: "Sample Person", links: [] };

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

function letter(over: Partial<LetterContent> = {}): LetterContent {
  return {
    ...blankLetter(sender, "Acme Labs", "Data Engineer"),
    paragraphs: [`I would like to join Acme Labs. ${words(150)}`],
    ...over,
  };
}

describe("blankLetter", () => {
  it("addresses the company and signs with the sender name", () => {
    const l = blankLetter(sender, "Acme Labs", "Data Engineer");
    expect(l.recipient.company).toBe("Acme Labs");
    expect(l.subject).toBe("Application for Data Engineer");
    expect(l.signature).toBe("Sample Person");
    expect(LetterContentSchema.safeParse(l).success).toBe(true);
  });

  it("leaves the subject out when there is no role", () => {
    expect(blankLetter(sender, "Acme Labs").subject).toBeUndefined();
  });
});

describe("LetterContentSchema", () => {
  it("rejects a letter with no paragraphs or no company", () => {
    expect(
      LetterContentSchema.safeParse({ ...letter(), paragraphs: [] }).success,
    ).toBe(false);
    expect(
      LetterContentSchema.safeParse({
        ...letter(),
        recipient: { company: "" },
      }).success,
    ).toBe(false);
  });

  it("defaults the closing", () => {
    const { closing: _closing, ...rest } = letter();
    const parsed = LetterContentSchema.parse(rest);
    expect(parsed.closing).toBe("Sincerely,");
  });
});

describe("letterCheck", () => {
  it("passes a clean letter that names the company", () => {
    const r = letterCheck(letter());
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
  });

  it("blocks an empty paragraph and a leftover placeholder", () => {
    expect(letterCheck(blankLetter(sender, "Acme Labs")).ok).toBe(false);
    const r = letterCheck(
      letter({ paragraphs: [`Acme Labs [fill in why]. ${words(150)}`] }),
    );
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.message.includes("placeholder"))).toBe(true);
  });

  it("warns about dashes, a missing company name and generic salutation", () => {
    const r = letterCheck(
      letter({
        salutation: "Dear Sir/Madam,",
        paragraphs: [`I build things — fast. ${words(150)}`],
      }),
    );
    expect(r.ok).toBe(true);
    const msgs = r.issues.map((i) => i.message).join("|");
    expect(msgs).toContain("Dash");
    expect(msgs).toContain("never names Acme Labs");
    expect(msgs).toContain("Sir or Madam");
  });

  it("warns when the body is too short or too long", () => {
    expect(
      letterCheck(letter({ paragraphs: ["Acme Labs is great."] })).issues[0]
        ?.message,
    ).toContain("Short");
    expect(
      letterCheck(letter({ paragraphs: [`Acme Labs ${words(450)}`] }))
        .issues.map((i) => i.message)
        .join("|"),
    ).toContain("Long");
  });
});

describe("letterText", () => {
  it("reads in order and skips empty parts", () => {
    const t = letterText(letter({ date: "1 January 2026" }));
    expect(t.startsWith("1 January 2026")).toBe(true);
    expect(t).toContain("Subject: Application for Data Engineer");
    expect(t.trimEnd().endsWith("Sample Person")).toBe(true);
  });
});
