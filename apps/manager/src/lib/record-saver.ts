import { saveCellAction, type Resource } from "@/actions/content";

type Saved = Awaited<ReturnType<typeof saveCellAction>>;

/**
 * Saves for one resource run one at a time per record, and each save sends the
 * updatedAt returned by the previous one. Without the queue, tabbing through
 * two fields fires both saves with the same stale timestamp and the second is
 * rejected as a conflict.
 */
export function makeSaver(resource: Resource) {
  const records = new Map<
    string,
    { at: string | null; chain: Promise<unknown> }
  >();
  return {
    /** Set the version the next save compares against (initial load, reload). */
    reset(id: string, at: string | null) {
      const r = records.get(id);
      if (r) r.at = at;
      else records.set(id, { at, chain: Promise.resolve() });
    },
    save(id: string, patch: Record<string, unknown>): Promise<Saved> {
      const r = records.get(id) ?? { at: null, chain: Promise.resolve() };
      records.set(id, r);
      const run = r.chain.then(async () => {
        const res = await saveCellAction(resource, id, r.at, patch);
        if (res.ok) r.at = res.data.updatedAt;
        return res;
      });
      r.chain = run.catch(() => {});
      return run;
    },
  };
}

export const isConflict = (error: string) => error.includes("changed since");
