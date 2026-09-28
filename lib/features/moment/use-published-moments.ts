"use client";

import { useEffect, useState } from "react";

import { useAppDispatch } from "@/lib/hooks";

import { momentApi } from "./moment-api";
import type { MomentResponse } from "./moment-contracts";

const PAGE_SIZE = 100;

export function usePublishedMoments() {
  const dispatch = useAppDispatch();
  const [attempt, setAttempt] = useState(0);
  const [moments, setMoments] = useState<MomentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setIsError(false);
      const pages: MomentResponse[][] = [];
      try {
        const first = dispatch(
          momentApi.endpoints.getPublicMoments.initiate({ page: 0, size: PAGE_SIZE })
        );
        const firstPage = await first.unwrap();
        first.unsubscribe();
        pages.push(firstPage.list);
        for (let page = 1; page < firstPage.totalPages; page += 1) {
          const next = dispatch(
            momentApi.endpoints.getPublicMoments.initiate({ page, size: PAGE_SIZE })
          );
          const result = await next.unwrap();
          next.unsubscribe();
          pages.push(result.list);
        }
        if (!cancelled) setMoments(pages.flat());
      } catch {
        if (!cancelled) setIsError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [attempt, dispatch]);

  return {
    isError,
    isLoading,
    moments,
    retry: () => setAttempt((value) => value + 1),
  };
}
