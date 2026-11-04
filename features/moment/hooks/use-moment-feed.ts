import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { toast } from "@heroui/react";

import { getApiErrorMessage } from "@/lib/api/errors";
import {
  useGetPublicMomentsQuery,
  useLazyGetPublicMomentsQuery,
  type MomentResponse,
} from "@/lib/features/moment";
import type { PageResult } from "@/lib/api";

export const useMomentFeed = (
  pageSize: number = 12,
  initialPage: PageResult<MomentResponse> | null = null,
  topic?: string,
  period?: { year: number; month: number },
  options?: { retainPreviousData?: boolean }
) => {
  const retainPreviousData = options?.retainPreviousData ?? false;
  const filterKey = JSON.stringify([topic ?? null, period?.year ?? null, period?.month ?? null]);
  const currentFilter = useRef<string | null>(filterKey);
  const pendingPage = useRef<string | null>(null);
  const [removedIds, setRemovedIds] = useState<ReadonlySet<number>>(() => new Set());
  const filtered = Boolean(topic || period);
  const [displayed, setDisplayed] = useState(() => ({
    filterKey,
    page: filtered ? null : initialPage,
    extraEntries: [] as MomentResponse[],
    nextPage: 1,
  }));

  useEffect(() => {
    currentFilter.current = filterKey;
    return () => {
      currentFilter.current = null;
    };
  }, [filterKey]);

  const query = useGetPublicMomentsQuery(
    { page: 0, size: pageSize, ...(topic ? { topic } : {}), ...(period ?? {}) },
    { skip: Boolean(initialPage) && !filtered }
  );
  // currentData belongs to these exact query args; data can still belong to the old topic.
  const requestedData = query.currentData ?? (!filtered ? initialPage : null);
  if (requestedData && (displayed.filterKey !== filterKey || displayed.page !== requestedData)) {
    setDisplayed({
      filterKey,
      page: requestedData,
      extraEntries: displayed.filterKey === filterKey ? displayed.extraEntries : [],
      nextPage: displayed.filterKey === filterKey ? displayed.nextPage : 1,
    });
  }

  const { extraEntries, nextPage } = displayed;
  const waitingForFilter = displayed.filterKey !== filterKey;
  const data = waitingForFilter && !retainPreviousData ? null : displayed.page;
  const isLoading = !data && !query.isError;
  const isError = (!retainPreviousData || !data) && query.isError;
  const isRefreshing = Boolean(data) && Boolean(query.isFetching) && !query.currentData;
  const isRefreshError = retainPreviousData && Boolean(data) && query.isError;
  const refetch = query.refetch;
  const [loadPage, loadingMore] = useLazyGetPublicMomentsQuery();

  const moments = useMemo(() => {
    if (waitingForFilter && !retainPreviousData) return [];
    const merged = new Map<number, MomentResponse>();
    data?.list.forEach((moment) => merged.set(moment.id, moment));
    extraEntries.forEach((moment) => merged.set(moment.id, moment));
    return [...merged.values()].filter((moment) => !removedIds.has(moment.id));
  }, [extraEntries, data?.list, removedIds, waitingForFilter, retainPreviousData]);

  const removeMoment = useCallback((id: number) => {
    setRemovedIds((current) => new Set([...current, id]));
  }, []);

  const loadMore = useCallback(async () => {
    if (displayed.filterKey !== filterKey) return false;
    const requestKey = JSON.stringify([filterKey, nextPage]);
    if (pendingPage.current === requestKey) return false;
    pendingPage.current = requestKey;

    try {
      const result = await loadPage({
        page: nextPage,
        size: pageSize,
        ...(topic ? { topic } : {}),
        ...(period ?? {}),
      }).unwrap();
      if (currentFilter.current !== filterKey) return false;
      setDisplayed((current) => {
        if (current.filterKey !== filterKey) return current;
        const merged = new Map(current.extraEntries.map((m) => [m.id, m]));
        result.list.forEach((m) => merged.set(m.id, m));
        return { ...current, extraEntries: [...merged.values()], nextPage: current.nextPage + 1 };
      });
      return true;
    } catch (err) {
      if (currentFilter.current === filterKey) {
        toast.danger(getApiErrorMessage(err, "Unable to load more moments. Please try again."));
      }
      return false;
    } finally {
      if (pendingPage.current === requestKey) pendingPage.current = null;
    }
  }, [displayed.filterKey, filterKey, loadPage, nextPage, pageSize, period, topic]);
  const hasMore = data && displayed.filterKey === filterKey ? nextPage < data.totalPages : false;

  return {
    moments,
    isLoading,
    isError,
    isRefreshing,
    isRefreshError,
    displayKey: displayed.filterKey,
    isFetchingMore: loadingMore.isFetching,
    hasMore,
    loadMore,
    removeMoment,
    refetch,
  };
};
