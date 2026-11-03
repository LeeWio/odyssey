"use client";

import { toast } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

const COMMENT_LOAD_FAILURES = ["loadRepliesFailed", "loadMoreFailed", "loadNewFailed"] as const;

type CommentLoadFailure = (typeof COMMENT_LOAD_FAILURES)[number];

function isCommentLoadFailure(message: string): message is CommentLoadFailure {
  return (COMMENT_LOAD_FAILURES as readonly string[]).includes(message);
}

/** Track user-triggered loads independently from RTK Query's first-page fetches. */
export function useCommentLoader() {
  const t = useTranslations("Comments");
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
        toast.danger(isCommentLoadFailure(failureMessage) ? t(failureMessage) : failureMessage);
        return false;
      } finally {
        inFlight.current.delete(key);
        setPendingKeys(new Set(inFlight.current));
      }
    },
    [t]
  );

  return { pendingKeys, run };
}
