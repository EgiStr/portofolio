import { describe, expect, it } from "vitest";
import { factGuard, stripDashes } from "./guard";

const source =
  "Built a RAG assistant prototype for internal DX documents with LangGraph, reaching 92% sizing accuracy on 200 scenarios.";

describe("factGuard", () => {
  it("accepts a rewrite that only reuses source facts", () => {
    const r = factGuard(
      "Built a LangGraph RAG assistant for internal DX documents, reaching 92% sizing accuracy.",
      [source],
    );
    expect(r).toEqual({ ok: true, unknown: [] });
  });

  it("rejects an invented number", () => {
    const r = factGuard("Cut review time by 40% with a RAG assistant.", [
      source,
    ]);
    expect(r.ok).toBe(false);
    expect(r.unknown).toContain("40");
  });

  it("rejects an invented tool or employer", () => {
    const r = factGuard("Deployed the assistant on Kubernetes at Google.", [
      source,
    ]);
    expect(r.unknown).toEqual(expect.arrayContaining(["Kubernetes", "Google"]));
  });

  it("ignores any sentence-start word but still checks acronyms there", () => {
    expect(
      factGuard("Builds a RAG assistant. Tests it on 200 scenarios.", [source])
        .ok,
    ).toBe(true);
    expect(factGuard("AWS hosts the assistant.", [source]).unknown).toContain(
      "AWS",
    );
  });

  it("ignores sentence-start verbs", () => {
    expect(factGuard("Tested 200 scenarios.", [source]).ok).toBe(true);
  });
});

describe("stripDashes", () => {
  it("turns dash punctuation into commas and keeps hyphenated words", () => {
    expect(stripDashes("Built a star-schema mart — fed a live dashboard")).toBe(
      "Built a star-schema mart, fed a live dashboard",
    );
    expect(stripDashes("A -- B")).toBe("A, B");
  });
});
