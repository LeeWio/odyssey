import { useState, useCallback, useMemo } from "react";
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
  topic?: string
) => {
  const [extraEntries, setExtraEntries] = useState<MomentResponse[]>([]);
  const [nextPage, setNextPage] = useState(1);
  const [loadedTopic, setLoadedTopic] = useState(topic);
  const filtered = Boolean(topic);

  if (topic !== loadedTopic) {
    setLoadedTopic(topic);
    setExtraEntries([]);
    setNextPage(1);
  }

  const query = useGetPublicMomentsQuery(
    { page: 0, size: pageSize, ...(topic ? { topic } : {}) },
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
    try {
      const result = await loadPage({
        page: nextPage,
        size: pageSize,
        ...(topic ? { topic } : {}),
      }).unwrap();
      setExtraEntries((current) => {
        const merged = new Map(current.map((m) => [m.id, m]));
        result.list.forEach((m) => merged.set(m.id, m));
        return [...merged.values()];
      });
      setNextPage((current) => current + 1);
    } catch (err) {
      toast.danger(getApiErrorMessage(err, "Unable to load more moments. Please try again."));
    }
  }, [loadPage, nextPage, pageSize, topic]);
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
