"use client";

import { useCallback, useEffect, useState } from "react";

/** Reports one named interaction without letting callers share a counter. */
export type Report = (id: string, active: boolean) => void;

/** True while any reported menu, sheet, share, or mutation is still active. */
export function useEngagement() {
  const [active, setActive] = useState<ReadonlySet<string>>(() => new Set());
  const report = useCallback<Report>((id, on) => {
    setActive((current) => {
      if (current.has(id) === on) return current;
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  return { isEngaged: active.size > 0, report };
}

/** Keeps one interaction reported for as long as `active` stays true. */
export function useReport(id: string, active: boolean, report: Report) {
  useEffect(() => {
    report(id, active);
    return () => report(id, false);
  }, [active, id, report]);
}
