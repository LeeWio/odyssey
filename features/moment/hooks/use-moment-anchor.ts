import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";

import type { MomentResponse } from "@/lib/features/moment";

export const MOMENT_ANCHOR_PAGE_LIMIT = 5;

export function getMomentAnchorId(hash: string): number | null {
  const match = /^#moment-([1-9]\d*)$/.exec(hash);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) ? id : null;
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

type AnchorStatus = "searching" | "found" | "missing" | "error" | "paused" | "dismissed";
interface Progress {
  hash: string;
  status: AnchorStatus;
  pages: number;
}

interface MomentAnchorOptions {
  moments: MomentResponse[];
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetchingMore: boolean;
  loadMore: () => Promise<boolean>;
}

export function useMomentAnchor({
  moments,
  hasMore,
  isLoading,
  isError,
  isFetchingMore,
  loadMore,
}: MomentAnchorOptions) {
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
    () => ""
  );
  const targetId = getMomentAnchorId(hash);
  const [progress, setProgress] = useState<Progress>({ hash: "", status: "dismissed", pages: 0 });
  const pending = useRef(false);
  const [requestVersion, requestFinished] = useReducer((value: number) => value + 1, 0);
  if (progress.hash !== hash) {
    setProgress({ hash, status: targetId ? "searching" : "dismissed", pages: 0 });
  }
  const status = progress.hash === hash ? progress.status : "searching";
  const pages = progress.hash === hash ? progress.pages : 0;

  useEffect(() => {
    if (!targetId || status !== "searching" || isLoading || isError || isFetchingMore) return;

    const target = moments.some((moment) => moment.id === targetId)
      ? document.getElementById(`moment-${targetId}`)
      : null;
    if (target) {
      const frame = requestAnimationFrame(() => {
        // Resolve once, without smooth scrolling or refocusing after feed updates.
        target.scrollIntoView({ behavior: "instant", block: "start" });
        target.focus({ preventScroll: true });
        setProgress({ hash, status: "found", pages });
      });
      return () => cancelAnimationFrame(frame);
    }

    if (pending.current) return;
    if (!hasMore || pages >= MOMENT_ANCHOR_PAGE_LIMIT) {
      const frame = requestAnimationFrame(() => {
        setProgress({ hash, status: hasMore ? "paused" : "missing", pages });
      });
      return () => cancelAnimationFrame(frame);
    }

    pending.current = true;
    void loadMore()
      .catch(() => false)
      .then((success) => {
        if (window.location.hash !== hash) return;
        setProgress((current) => {
          if (current.hash === hash && current.status !== "searching") return current;
          return { hash, status: success ? "searching" : "error", pages: pages + 1 };
        });
      })
      .finally(() => {
        pending.current = false;
        requestFinished();
      });
  }, [
    hash,
    targetId,
    status,
    pages,
    moments,
    hasMore,
    isLoading,
    isError,
    isFetchingMore,
    loadMore,
    requestVersion,
  ]);

  const retry = useCallback(() => setProgress({ hash, status: "searching", pages: 0 }), [hash]);
  const dismiss = useCallback(() => setProgress({ hash, status: "dismissed", pages: 0 }), [hash]);

  return { targetId, status: targetId ? status : "dismissed", retry, dismiss };
}
