import { describe, expect, it } from "vitest";
import {
  appliedAtAfterMove,
  isOverdue,
  LEGACY_STATUS,
  pipelineCounts,
  stageEventTitle,
} from "./stages";

const now = new Date("2026-11-24T10:00:00Z");

describe("appliedAtAfterMove", () => {
  it("sets the date the first time an application leaves the wishlist", () => {
    expect(appliedAtAfterMove(null, "APPLIED", now)).toEqual(now);
    expect(appliedAtAfterMove(null, "INTERVIEW", now)).toEqual(now);
  });
  it("keeps an existing date and leaves wishlist and withdrawn moves unset", () => {
    const first = new Date("2026-11-01T00:00:00Z");
    expect(appliedAtAfterMove(first, "OFFER", now)).toEqual(first);
    expect(appliedAtAfterMove(null, "WISHLIST", now)).toBeNull();
    expect(appliedAtAfterMove(null, "WITHDRAWN", now)).toBeNull();
  });
});

describe("isOverdue", () => {
  it("flags a past follow-up on an open application only", () => {
    expect(isOverdue("2026-11-23T00:00:00Z", "APPLIED", now)).toBe(true);
    expect(isOverdue("2026-11-25T00:00:00Z", "APPLIED", now)).toBe(false);
    expect(isOverdue("2026-11-23T00:00:00Z", "REJECTED", now)).toBe(false);
    expect(isOverdue(null, "APPLIED", now)).toBe(false);
  });
});

describe("pipelineCounts", () => {
  it("counts per stage, open and overdue", () => {
    const c = pipelineCounts(
      [
        { stage: "APPLIED", followUpAt: "2026-11-20T00:00:00Z" },
        { stage: "INTERVIEW" },
        { stage: "REJECTED", followUpAt: "2026-11-20T00:00:00Z" },
      ],
      now,
    );
    expect(c).toMatchObject({ total: 3, open: 2, overdue: 1 });
    expect(c.byStage.APPLIED).toBe(1);
    expect(c.byStage.REJECTED).toBe(1);
  });
});

it("maps legacy statuses and titles stage events", () => {
  expect(LEGACY_STATUS.drafted).toBe("WISHLIST");
  expect(stageEventTitle(null, "APPLIED")).toBe("Added as Applied");
  expect(stageEventTitle("APPLIED", "INTERVIEW")).toBe("Applied → Interview");
});
