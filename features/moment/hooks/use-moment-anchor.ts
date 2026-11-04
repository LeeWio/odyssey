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
  scope: string;
  status: AnchorStatus;
  pages: number;
  nextPage: number;
  matchedPage?: number;
}

interface MomentAnchorOptions {
  moments: MomentResponse[];
  page: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  isFetchingPage: boolean;
  fetchPage: (page: number) => Promise<{ list: MomentResponse[] } | null>;
  onPageChange: (page: number) => void;
  filterKey?: string;
}

export function useMomentAnchor({
  moments,
  page,
  totalPages,
  isLoading,
  isError,
  isFetchingPage,
  fetchPage,
  onPageChange,
  filterKey = "",
}: MomentAnchorOptions) {
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
    () => ""
  );
  const targetId = getMomentAnchorId(hash);
  const scope = `${filterKey}:${hash}`;
  const [progress, setProgress] = useState<Progress>({
    scope: "",
    status: "dismissed",
    pages: 0,
    nextPage: 1,
  });
  const pending = useRef<object | null>(null);
  const activeScope = useRef(scope);
  const previousScope = useRef(scope);
  const [requestVersion, requestFinished] = useReducer((value: number) => value + 1, 0);
  if (progress.scope !== scope) {
    setProgress({ scope, status: targetId ? "searching" : "dismissed", pages: 0, nextPage: 1 });
  }
  const status = progress.scope === scope ? progress.status : "searching";

  useEffect(() => {
    if (previousScope.current !== scope) pending.current = null;
    previousScope.current = scope;
    activeScope.current = scope;
    return () => {
      activeScope.current = "";
    };
  }, [scope]);

  useEffect(() => {
    if (!targetId || status !== "searching" || isLoading || isError || isFetchingPage) return;

    const target = moments.some((moment) => moment.id === targetId)
      ? document.getElementById(`moment-${targetId}`)
      : null;
    if (target) {
      const frame = requestAnimationFrame(() => {
        // Resolve once, without smooth scrolling or refocusing after feed updates.
        target.scrollIntoView({ behavior: "instant", block: "start" });
        target.focus({ preventScroll: true });
        setProgress((current) => ({ ...current, status: "found" }));
      });
      return () => cancelAnimationFrame(frame);
    }

    if (pending.current || progress.matchedPage !== undefined) return;
    const nextPage = progress.nextPage === page ? progress.nextPage + 1 : progress.nextPage;
    if (progress.pages >= MOMENT_ANCHOR_PAGE_LIMIT || nextPage > totalPages) {
      const frame = requestAnimationFrame(() => {
        setProgress((current) => ({
          ...current,
          status: nextPage > totalPages ? "missing" : "paused",
          nextPage,
        }));
      });
      return () => cancelAnimationFrame(frame);
    }

    const request = {};
    pending.current = request;
    void fetchPage(nextPage)
      .catch(() => null)
      .then((result) => {
        if (pending.current !== request || activeScope.current !== scope) return;
        const found = result?.list.some((moment) => moment.id === targetId);
        setProgress((current) => ({
          ...current,
          status: result ? "searching" : "error",
          pages: current.pages + 1,
          nextPage: result ? nextPage + 1 : nextPage,
          matchedPage: found ? nextPage : undefined,
        }));
        // Background lookup never mounts scanned pages. Navigate only once the
        // matching page is known, keeping the visitor's current view intact.
        if (found) onPageChange(nextPage);
      })
      .finally(() => {
        if (pending.current === request && activeScope.current === scope) {
          pending.current = null;
          requestFinished();
        }
      });
  }, [
    hash,
    targetId,
    status,
    progress,
    scope,
    moments,
    page,
    totalPages,
    isLoading,
    isError,
    isFetchingPage,
    fetchPage,
    onPageChange,
    requestVersion,
  ]);

  const retry = useCallback(() => {
    setProgress((current) => ({ ...current, status: "searching", pages: 0 }));
  }, []);
  const dismiss = useCallback(() => {
    pending.current = null;
    setProgress((current) => ({ ...current, status: "dismissed" }));
  }, []);

  return { targetId, status: targetId ? status : "dismissed", retry, dismiss };
}
