"use client";

import { toast } from "@heroui/react";
import { useCallback, useRef, useState } from "react";

/** Track user-triggered loads independently from RTK Query's first-page fetches. */
export function useCommentLoader() {
  const inFlight = useRef(new Set<string>());
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(new Set());

  const run = useCallback(
    async (key: string, load: () => Promise<void>, failureMessage: string) => {
      // Claim synchronously: multiple events can arrive before React renders.
      if (inFlight.current.has(key)) return false;
      inFlight.current.add(key);
      setPendingKeys(new Set(inFlight.current));
      try {
        await load();
        return true;
      } catch {
        toast.danger(failureMessage);
        return false;
      } finally {
        inFlight.current.delete(key);
        setPendingKeys(new Set(inFlight.current));
      }
    },
    []
  );

  return { pendingKeys, run };
}
