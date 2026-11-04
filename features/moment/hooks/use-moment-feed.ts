import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  useGetPublicMomentsQuery,
  useLazyGetPublicMomentsQuery,
  type MomentResponse,
} from "@/lib/features/moment";
import type { PageResult } from "@/lib/api";

interface MomentFeedOptions {
  retainPreviousData?: boolean;
}

export const useMomentFeed = (
  pageSize: number = 12,
  initialPage: PageResult<MomentResponse> | null = null,
  topic?: string,
  period?: { year: number; month: number },
  options?: MomentFeedOptions,
  requestedPage: number = 1
) => {
  const retainPreviousData = options?.retainPreviousData ?? false;
  const filterKey = JSON.stringify([topic ?? null, period?.year ?? null, period?.month ?? null]);
  const currentFilter = useRef(filterKey);
  const pendingPages = useRef(new Map<string, Promise<PageResult<MomentResponse> | null>>());
  const [initial] = useState(() => ({ filterKey, page: initialPage }));
  const [reloadInitial, setReloadInitial] = useState(false);
  const [removedIds, setRemovedIds] = useState<ReadonlySet<number>>(() => new Set());
  const [displayed, setDisplayed] = useState(() => ({
    filterKey,
    page:
      initial.filterKey === filterKey && initial.page?.page === requestedPage ? initial.page : null,
  }));

  useEffect(() => {
    currentFilter.current = filterKey;
    return () => {
      currentFilter.current = "";
    };
  }, [filterKey]);

  const initialMatches = initial.filterKey === filterKey && initial.page?.page === requestedPage;
  const query = useGetPublicMomentsQuery(
    { page: requestedPage - 1, size: pageSize, ...(topic ? { topic } : {}), ...(period ?? {}) },
    { skip: initialMatches && !reloadInitial }
  );
  const requestedData = query.currentData ?? (initialMatches ? initial.page : null);

  // Replace the current page atomically after the exact query succeeds. This
  // keeps Grid from appending into CSS columns and triggering a visible reflow.
  if (requestedData && (displayed.filterKey !== filterKey || displayed.page !== requestedData)) {
    setDisplayed({ filterKey, page: requestedData });
  }

  const waitingForPage =
    displayed.filterKey !== filterKey || displayed.page?.page !== requestedPage;
  const data = waitingForPage && !retainPreviousData ? null : displayed.page;
  const isLoading = !data && !query.isError;
  const isError = (!retainPreviousData || !data) && query.isError;
  const isRefreshing = Boolean(data) && Boolean(query.isFetching) && !query.currentData;
  const isRefreshError = retainPreviousData && Boolean(data) && query.isError;
  const queryRefetch = query.refetch;
  const refetch = useCallback(() => {
    if (initialMatches && !reloadInitial) setReloadInitial(true);
    else void queryRefetch();
  }, [initialMatches, reloadInitial, queryRefetch]);

  const moments = useMemo(() => {
    return (data?.list ?? []).filter((moment) => !removedIds.has(moment.id));
  }, [data?.list, removedIds]);

  const [loadPage, loadingPage] = useLazyGetPublicMomentsQuery();

  const fetchPage = useCallback(
    (page: number): Promise<PageResult<MomentResponse> | null> => {
      if (!Number.isSafeInteger(page) || page < 1) return Promise.resolve(null);
      const requestKey = JSON.stringify([filterKey, page]);
      const pending = pendingPages.current.get(requestKey);
      if (pending) return pending;

      const request = loadPage({
        page: page - 1,
        size: pageSize,
        ...(topic ? { topic } : {}),
        ...(period ?? {}),
      })
        .unwrap()
        .then((result) => (currentFilter.current === filterKey ? result : null))
        .catch(() => null)
        .finally(() => pendingPages.current.delete(requestKey));
      pendingPages.current.set(requestKey, request);
      return request;
    },
    [filterKey, loadPage, pageSize, period, topic]
  );

  const removeMoment = useCallback((id: number) => {
    setRemovedIds((current) => new Set([...current, id]));
  }, []);

  const totalPages = data?.totalPages ?? 0;

  return {
    moments,
    currentPage: requestedPage,
    displayedPage: data?.page ?? requestedPage,
    resolvedTotalPages: requestedData?.totalPages,
    totalPages,
    total: data?.total ?? 0,
    isLoading,
    isError,
    isRefreshing,
    isRefreshError,
    displayKey: `${displayed.filterKey}:${data?.page ?? requestedPage}`,
    isFetchingPage: query.isFetching || loadingPage.isFetching,
    fetchPage,
    removeMoment,
    refetch,
  };
};
