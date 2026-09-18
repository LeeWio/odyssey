"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useGetGuestbookRootsCursorQuery,
  useGetGuestbookRootsQuery,
  useGetHotGuestbookRootsQuery,
  useGetHotMomentCommentRootsQuery,
  useGetHotPostCommentRootsQuery,
  useGetMomentCommentRootsCursorQuery,
  useGetMomentCommentRootsQuery,
  useGetPostCommentRootsCursorQuery,
  useGetPostCommentRootsQuery,
  useLazyGetGuestbookRootsCursorQuery,
  useLazyGetGuestbookRootsQuery,
  useLazyGetHotGuestbookRootsQuery,
  useLazyGetHotMomentCommentRootsQuery,
  useLazyGetHotPostCommentRootsQuery,
  useLazyGetMomentCommentRootsCursorQuery,
  useLazyGetMomentCommentRootsQuery,
  useLazyGetPostCommentRootsCursorQuery,
  useLazyGetPostCommentRootsQuery,
  type CommentResponse,
} from "@/lib/features/comment";
import type { SortOrder } from "../context/comment-context";

const PAGE_SIZE = 20;

interface UseCommentRootsArgs {
  isGuestbook: boolean;
  isMoment: boolean;
  postId: number;
  momentId: number;
  sortOrder: SortOrder;
}

export function useCommentRoots({
  isGuestbook,
  isMoment,
  postId,
  momentId,
  sortOrder,
}: UseCommentRootsArgs) {
  const targetKey = isGuestbook ? "guestbook" : isMoment ? `moment:${momentId}` : `post:${postId}`;
  const queryKey = `${targetKey}:${sortOrder}`;
  const useCursorRoots = sortOrder === "newest";
  const usePost = !isGuestbook && !isMoment;

  const [prependedRoots, setPrependedRoots] = useState<Record<string, CommentResponse[]>>({});
  const [additionalRoots, setAdditionalRoots] = useState<Record<string, CommentResponse[]>>({});
  const [cursorStates, setCursorStates] = useState<
    Record<string, { cursor?: number; hasMore: boolean }>
  >({});
  const [pagedStates, setPagedStates] = useState<
    Record<string, { page: number; hasMore: boolean }>
  >({});

  const postCursorResult = useGetPostCommentRootsCursorQuery(
    { postId, size: PAGE_SIZE },
    { skip: !usePost || !useCursorRoots || postId <= 0 }
  );
  const momentCursorResult = useGetMomentCommentRootsCursorQuery(
    { momentId, size: PAGE_SIZE },
    { skip: !isMoment || !useCursorRoots || momentId <= 0 }
  );
  const guestbookCursorResult = useGetGuestbookRootsCursorQuery(
    { size: PAGE_SIZE },
    { skip: !isGuestbook || !useCursorRoots }
  );
  const postOldestResult = useGetPostCommentRootsQuery(
    {
      postId,
      page: 0,
      size: PAGE_SIZE,
      sort: ["createdAt,asc"],
    },
    { skip: !usePost || useCursorRoots || sortOrder !== "oldest" || postId <= 0 }
  );
  const momentOldestResult = useGetMomentCommentRootsQuery(
    {
      momentId,
      page: 0,
      size: PAGE_SIZE,
      sort: ["createdAt,asc"],
    },
    { skip: !isMoment || useCursorRoots || sortOrder !== "oldest" || momentId <= 0 }
  );
  const postHotResult = useGetHotPostCommentRootsQuery(
    { postId, page: 0, size: PAGE_SIZE },
    { skip: !usePost || useCursorRoots || sortOrder !== "likes" || postId <= 0 }
  );
  const momentHotResult = useGetHotMomentCommentRootsQuery(
    { momentId, page: 0, size: PAGE_SIZE },
    { skip: !isMoment || useCursorRoots || sortOrder !== "likes" || momentId <= 0 }
  );
  const guestbookOldestResult = useGetGuestbookRootsQuery(
    {
      page: 0,
      size: PAGE_SIZE,
      sort: ["createdAt,asc"],
    },
    { skip: !isGuestbook || useCursorRoots || sortOrder !== "oldest" }
  );
  const guestbookHotResult = useGetHotGuestbookRootsQuery(
    { page: 0, size: PAGE_SIZE },
    { skip: !isGuestbook || useCursorRoots || sortOrder !== "likes" }
  );

  const [loadPostCursor] = useLazyGetPostCommentRootsCursorQuery();
  const [loadMomentCursor] = useLazyGetMomentCommentRootsCursorQuery();
  const [loadGuestbookCursor] = useLazyGetGuestbookRootsCursorQuery();
  const [loadPostOldest] = useLazyGetPostCommentRootsQuery();
  const [loadMomentOldest] = useLazyGetMomentCommentRootsQuery();
  const [loadPostHot] = useLazyGetHotPostCommentRootsQuery();
  const [loadMomentHot] = useLazyGetHotMomentCommentRootsQuery();
  const [loadGuestbookOldest] = useLazyGetGuestbookRootsQuery();
  const [loadGuestbookHot] = useLazyGetHotGuestbookRootsQuery();

  const cursorRootsResult = isGuestbook
    ? guestbookCursorResult
    : isMoment
      ? momentCursorResult
      : postCursorResult;
  const pagedRootsResult = isGuestbook
    ? sortOrder === "likes"
      ? guestbookHotResult
      : guestbookOldestResult
    : isMoment
      ? sortOrder === "likes"
        ? momentHotResult
        : momentOldestResult
      : sortOrder === "likes"
        ? postHotResult
        : postOldestResult;
  const activeRootsResult = useCursorRoots ? cursorRootsResult : pagedRootsResult;

  const baseComments = useMemo(
    () => (useCursorRoots ? cursorRootsResult.data?.list : pagedRootsResult.data?.list) ?? [],
    [cursorRootsResult.data?.list, pagedRootsResult.data?.list, useCursorRoots]
  );

  const rawCommentsList = useMemo(() => {
    const seen = new Set<number>();
    const merged: CommentResponse[] = [];
    for (const comment of [
      ...(prependedRoots[queryKey] ?? []),
      ...baseComments,
      ...(additionalRoots[queryKey] ?? []),
    ]) {
      if (seen.has(comment.id)) continue;
      seen.add(comment.id);
      merged.push(comment);
    }
    return merged;
  }, [additionalRoots, baseComments, prependedRoots, queryKey]);

  const newestSeenId = useMemo(() => {
    if (rawCommentsList.length === 0) return undefined;
    return rawCommentsList.reduce(
      (maxId, comment) => (comment.id > maxId ? comment.id : maxId),
      rawCommentsList[0]!.id
    );
  }, [rawCommentsList]);

  const cursorState = cursorStates[queryKey];
  const rootCursor = cursorState?.cursor ?? cursorRootsResult.data?.nextCursor ?? undefined;
  const rootHasMore = cursorState?.hasMore ?? Boolean(cursorRootsResult.data?.hasMore);
  const pagedState = pagedStates[queryKey];
  const pagedPage = pagedState?.page ?? 0;
  const pagedHasMore =
    pagedState?.hasMore ?? Boolean(pagedRootsResult.data && pagedRootsResult.data.totalPages > 1);

  const appendRoots = useCallback(
    (list: CommentResponse[]) => {
      setAdditionalRoots((previous) => {
        const existing = new Set((previous[queryKey] ?? []).map((comment) => comment.id));
        return {
          ...previous,
          [queryKey]: [
            ...(previous[queryKey] ?? []),
            ...list.filter((comment) => !existing.has(comment.id)),
          ],
        };
      });
    },
    [queryKey]
  );

  const prependRoots = useCallback(
    (list: CommentResponse[]) => {
      if (list.length === 0) return;
      setPrependedRoots((previous) => {
        const existing = new Set((previous[queryKey] ?? []).map((comment) => comment.id));
        const incoming = list.filter((comment) => !existing.has(comment.id));
        if (incoming.length === 0) return previous;
        return {
          ...previous,
          [queryKey]: [...incoming, ...(previous[queryKey] ?? [])],
        };
      });
    },
    [queryKey]
  );

  const ensureRoot = useCallback(
    (root: CommentResponse) => {
      const alreadyPresent = rawCommentsList.some((comment) => comment.id === root.id);
      if (alreadyPresent) return;
      prependRoots([root]);
    },
    [prependRoots, rawCommentsList]
  );

  const loadMore = useCallback(async () => {
    if (!useCursorRoots) {
      if (!pagedHasMore) return;
      const nextPage = pagedPage + 1;
      const result = isGuestbook
        ? sortOrder === "likes"
          ? await loadGuestbookHot({ page: nextPage, size: PAGE_SIZE }).unwrap()
          : await loadGuestbookOldest({
              page: nextPage,
              size: PAGE_SIZE,
              sort: ["createdAt,asc"],
            }).unwrap()
        : isMoment
          ? sortOrder === "likes"
            ? await loadMomentHot({ momentId, page: nextPage, size: PAGE_SIZE }).unwrap()
            : await loadMomentOldest({
                momentId,
                page: nextPage,
                size: PAGE_SIZE,
                sort: ["createdAt,asc"],
              }).unwrap()
          : sortOrder === "likes"
            ? await loadPostHot({ postId, page: nextPage, size: PAGE_SIZE }).unwrap()
            : await loadPostOldest({
                postId,
                page: nextPage,
                size: PAGE_SIZE,
                sort: ["createdAt,asc"],
              }).unwrap();
      appendRoots(result.list);
      setPagedStates((previous) => ({
        ...previous,
        // page is 0-based; hasMore when another page index still exists
        [queryKey]: { page: nextPage, hasMore: nextPage + 1 < result.totalPages },
      }));
      return;
    }

    if (!rootHasMore || rootCursor == null) return;

    const result = isGuestbook
      ? await loadGuestbookCursor({ cursor: rootCursor, size: PAGE_SIZE }).unwrap()
      : isMoment
        ? await loadMomentCursor({ momentId, cursor: rootCursor, size: PAGE_SIZE }).unwrap()
        : await loadPostCursor({ postId, cursor: rootCursor, size: PAGE_SIZE }).unwrap();
    appendRoots(result.list);
    setCursorStates((previous) => ({
      ...previous,
      [queryKey]: { cursor: result.nextCursor ?? undefined, hasMore: result.hasMore },
    }));
  }, [
    appendRoots,
    isMoment,
    loadMomentCursor,
    loadMomentHot,
    loadMomentOldest,
    momentId,
    isGuestbook,
    loadGuestbookCursor,
    loadGuestbookHot,
    loadGuestbookOldest,
    loadPostCursor,
    loadPostHot,
    loadPostOldest,
    pagedHasMore,
    pagedPage,
    postId,
    queryKey,
    rootCursor,
    rootHasMore,
    sortOrder,
    useCursorRoots,
  ]);

  const remoteTotal = useCursorRoots ? cursorRootsResult.data?.total : pagedRootsResult.data?.total;
  const hasMore = useCursorRoots ? rootHasMore : pagedHasMore;

  return {
    queryKey,
    rawCommentsList,
    baseCount: baseComments.length,
    newestSeenId,
    isLoading: activeRootsResult.isLoading,
    isFetching: activeRootsResult.isFetching,
    error: activeRootsResult.error,
    refetch: activeRootsResult.refetch,
    remoteTotal,
    hasMore,
    loadMore,
    prependRoots,
    ensureRoot,
  };
}
