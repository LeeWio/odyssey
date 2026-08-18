import { useState, useCallback, useMemo } from "react";
import {
  useGetPublicMomentsQuery,
  useLazyGetPublicMomentsQuery,
  type MomentResponse,
} from "@/lib/features/moment";

export const useMomentFeed = (pageSize: number = 12) => {
  const [extraEntries, setExtraEntries] = useState<MomentResponse[]>([]);
  const [nextPage, setNextPage] = useState(1);

  const { data, isLoading, isError, refetch } = useGetPublicMomentsQuery({
    page: 0,
    size: pageSize,
  });
  const [loadPage, loadingMore] = useLazyGetPublicMomentsQuery();

  const moments = useMemo(() => {
    const merged = new Map<number, MomentResponse>();
    data?.list.forEach((moment) => merged.set(moment.id, moment));
    extraEntries.forEach((moment) => merged.set(moment.id, moment));
    return [...merged.values()];
  }, [extraEntries, data?.list]);

  const loadMore = useCallback(async () => {
    try {
      const result = await loadPage({ page: nextPage, size: pageSize }).unwrap();
      setExtraEntries((current) => {
        const merged = new Map(current.map((m) => [m.id, m]));
        result.list.forEach((m) => merged.set(m.id, m));
        return [...merged.values()];
      });
      setNextPage((current) => current + 1);
    } catch (err) {
      console.error("Failed to load more moments:", err);
    }
  }, [loadPage, nextPage, pageSize]);

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
