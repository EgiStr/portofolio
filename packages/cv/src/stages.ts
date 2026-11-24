/**
 * Job application stages. Client safe: the board, the detail page, the store
 * and the MCP tools all read the same order and labels from here.
 */

export const STAGES = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "GHOSTED",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  SCREENING: "Screening",
  ASSESSMENT: "Test / assessment",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  GHOSTED: "No response",
};

/** Board columns, in order. Closed stages share the last column. */
export const ACTIVE_STAGES: Stage[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
];
export const CLOSED_STAGES: Stage[] = [
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "GHOSTED",
];

export const isStage = (s: unknown): s is Stage =>
  typeof s === "string" && (STAGES as readonly string[]).includes(s);
export const isClosed = (s: Stage) => CLOSED_STAGES.includes(s);

/** Statuses the older "Log status" control and cv_log_application used. */
export const LEGACY_STATUS: Record<string, Stage> = {
  drafted: "WISHLIST",
  applied: "APPLIED",
  interview: "INTERVIEW",
  offer: "OFFER",
  rejected: "REJECTED",
  withdrawn: "WITHDRAWN",
};

/**
 * appliedAt after a move: kept if already set, set to `now` the first time an
 * application leaves the wishlist for an applied stage (not for WITHDRAWN,
 * which can mean "dropped before applying").
 */
export function appliedAtAfterMove(
  current: Date | null,
  to: Stage,
  now = new Date(),
): Date | null {
  if (current) return current;
  if (to === "WISHLIST" || to === "WITHDRAWN") return null;
  return now;
}

/** A follow-up is overdue when its date has passed and the application is still open. */
export function isOverdue(
  followUpAt: Date | string | null | undefined,
  stage: Stage,
  now = new Date(),
): boolean {
  if (!followUpAt || isClosed(stage)) return false;
  return new Date(followUpAt).getTime() < now.getTime();
}

export function stageEventTitle(from: Stage | null, to: Stage): string {
  return from
    ? `${STAGE_LABEL[from]} → ${STAGE_LABEL[to]}`
    : `Added as ${STAGE_LABEL[to]}`;
}

export const EVENT_KINDS = [
  "stage",
  "interview",
  "assessment",
  "note",
  "follow_up",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

/** Count per stage, plus open and overdue totals, for the board header. */
export function pipelineCounts(
  apps: { stage: Stage; followUpAt?: Date | string | null }[],
  now = new Date(),
) {
  const byStage = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<
    Stage,
    number
  >;
  let open = 0;
  let overdue = 0;
  for (const a of apps) {
    byStage[a.stage]++;
    if (!isClosed(a.stage)) open++;
    if (isOverdue(a.followUpAt, a.stage, now)) overdue++;
  }
  return { total: apps.length, open, overdue, byStage };
}
