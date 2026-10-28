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
  period?: { year: number; month: number }
) => {
  const [extraEntries, setExtraEntries] = useState<MomentResponse[]>([]);
  const [nextPage, setNextPage] = useState(1);
  const filterKey = JSON.stringify([topic ?? null, period?.year ?? null, period?.month ?? null]);
  const [loadedFilter, setLoadedFilter] = useState(filterKey);
  const currentFilter = useRef<string | null>(filterKey);
  const pendingPage = useRef<string | null>(null);
  const filtered = Boolean(topic || period);

  useEffect(() => {
    currentFilter.current = filterKey;
    return () => {
      currentFilter.current = null;
    };
  }, [filterKey]);

  if (filterKey !== loadedFilter) {
    setLoadedFilter(filterKey);
    setExtraEntries([]);
    setNextPage(1);
  }

  const query = useGetPublicMomentsQuery(
    { page: 0, size: pageSize, ...(topic ? { topic } : {}), ...(period ?? {}) },
    { skip: Boolean(initialPage) && !filtered }
  );
  const clientList = query.data?.list ?? [];
  const initialList = initialPage?.list ?? [];
  const clientIsNewer =
    clientList.length > 0 &&
    (initialList.length === 0 ||
      clientList[0].id !== initialList[0].id ||
      clientList.length !== initialList.length);
  const data =
    !filtered && initialPage && !clientIsNewer ? initialPage : (query.data ?? initialPage);
  const isLoading = (!initialPage || filtered) && query.isLoading;
  const isError = (!initialPage || filtered) && query.isError;
  const refetch = query.refetch;
  const [loadPage, loadingMore] = useLazyGetPublicMomentsQuery();

  const moments = useMemo(() => {
    const merged = new Map<number, MomentResponse>();
    data?.list.forEach((moment) => merged.set(moment.id, moment));
    extraEntries.forEach((moment) => merged.set(moment.id, moment));
    return [...merged.values()];
  }, [extraEntries, data?.list]);

  const loadMore = useCallback(async () => {
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
      setExtraEntries((current) => {
        const merged = new Map(current.map((m) => [m.id, m]));
        result.list.forEach((m) => merged.set(m.id, m));
        return [...merged.values()];
      });
      setNextPage((current) => current + 1);
      return true;
    } catch (err) {
      if (currentFilter.current === filterKey) {
        toast.danger(getApiErrorMessage(err, "Unable to load more moments. Please try again."));
      }
      return false;
    } finally {
      if (pendingPage.current === requestKey) pendingPage.current = null;
    }
  }, [filterKey, loadPage, nextPage, pageSize, period, topic]);
  const hasMore = data ? nextPage < data.totalPages : false;

  return {
    moments,
    isLoading,
    isError,
    isFetchingMore: loadingMore.isFetching,
    hasMore,
    loadMore,
    refetch,
  };
};
