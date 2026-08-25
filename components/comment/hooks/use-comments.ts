"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useGetGuestbookRootsQuery,
  useGetHotGuestbookRootsQuery,
  useGetGuestbookRootsCursorQuery,
  useGetHotPostCommentRootsQuery,
  useGetPostCommentRootsQuery,
  useGetPostCommentRootsCursorQuery,
  useLazyGetGuestbookRootsCursorQuery,
  useLazyGetGuestbookRootsQuery,
  useLazyGetHotGuestbookRootsQuery,
  useLazyGetHotPostCommentRootsQuery,
  useLazyGetPostCommentRootsQuery,
  useLazyGetPostCommentRootsCursorQuery,
  useLazyGetCommentRepliesCursorQuery,
  type CommentResponse,
} from "@/lib/features/comment";
import { useCommentContext } from "../context/comment-context";
import type { EnhancedComment } from "../types";

const PAGE_SIZE = 20;
const PAGE_SIZE_STEP = 5;

interface ReplyPage {
  comments: CommentResponse[];
  nextCursor: number | null;
  hasMore: boolean;
}

export function useComments() {
  const { isGuestbook, postId, sortOrder, highlightedCommentId } = useCommentContext();

  const queryKey = `${isGuestbook ? "guestbook" : "post"}:${postId}:${sortOrder}`;
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const [additionalRoots, setAdditionalRoots] = useState<Record<string, CommentResponse[]>>({});
  const [cursorStates, setCursorStates] = useState<
    Record<string, { cursor?: number; hasMore: boolean }>
  >({});
  const [pagedStates, setPagedStates] = useState<
    Record<string, { page: number; hasMore: boolean }>
  >({});
  const [replyPages, setReplyPages] = useState<Record<number, ReplyPage>>({});
  const [loadingReplyIds, setLoadingReplyIds] = useState<Set<number>>(new Set());

  const useCursorRoots = sortOrder === "newest";
  const postCommentsResult = useGetPostCommentRootsCursorQuery(
    { postId, size: PAGE_SIZE },
    { skip: isGuestbook || !useCursorRoots || postId <= 0 }
  );
  const guestbookRootsResult = useGetGuestbookRootsCursorQuery(
    { size: PAGE_SIZE },
    { skip: !isGuestbook || !useCursorRoots }
  );
  const postRootsResult = useGetPostCommentRootsQuery(
    {
      postId,
      page: 0,
      size: PAGE_SIZE,
      sort: sortOrder === "oldest" ? ["createdAt,asc"] : undefined,
    },
    { skip: isGuestbook || useCursorRoots || sortOrder === "likes" || postId <= 0 }
  );
  const postHotRootsResult = useGetHotPostCommentRootsQuery(
    { postId, page: 0, size: PAGE_SIZE },
    { skip: isGuestbook || useCursorRoots || sortOrder !== "likes" || postId <= 0 }
  );
  const guestbookPagedRootsResult = useGetGuestbookRootsQuery(
    {
      page: 0,
      size: PAGE_SIZE,
      sort: sortOrder === "oldest" ? ["createdAt,asc"] : undefined,
    },
    { skip: !isGuestbook || useCursorRoots || sortOrder === "likes" }
  );
  const guestbookHotRootsResult = useGetHotGuestbookRootsQuery(
    { page: 0, size: PAGE_SIZE },
    { skip: !isGuestbook || useCursorRoots || sortOrder !== "likes" }
  );
  const [loadPostRoots] = useLazyGetPostCommentRootsCursorQuery();
  const [loadGuestbookRoots] = useLazyGetGuestbookRootsCursorQuery();
  const [loadPostPagedRoots] = useLazyGetPostCommentRootsQuery();
  const [loadPostHotRoots] = useLazyGetHotPostCommentRootsQuery();
  const [loadGuestbookPagedRoots] = useLazyGetGuestbookRootsQuery();
  const [loadGuestbookHotRoots] = useLazyGetHotGuestbookRootsQuery();
  const [loadRepliesQuery] = useLazyGetCommentRepliesCursorQuery();

  const cursorRootsResult = isGuestbook ? guestbookRootsResult : postCommentsResult;
  const pagedRootsResult = isGuestbook
    ? sortOrder === "likes"
      ? guestbookHotRootsResult
      : guestbookPagedRootsResult
    : sortOrder === "likes"
      ? postHotRootsResult
      : postRootsResult;
  const activeRootsResult = useCursorRoots ? cursorRootsResult : pagedRootsResult;
  const isLoading = activeRootsResult.isLoading;
  const isFetching = activeRootsResult.isFetching;
  const error = activeRootsResult.error;
  const refetch = activeRootsResult.refetch;
  const baseComments = useMemo(
    () => (useCursorRoots ? cursorRootsResult.data?.list : pagedRootsResult.data?.list) ?? [],
    [cursorRootsResult.data?.list, pagedRootsResult.data?.list, useCursorRoots]
  );
  const rawCommentsList = useMemo(() => {
    const existingIds = new Set(baseComments.map((comment) => comment.id));
    const appendedComments = additionalRoots[queryKey] ?? [];
    return [...baseComments, ...appendedComments.filter((comment) => !existingIds.has(comment.id))];
  }, [additionalRoots, baseComments, queryKey]);
  const cursorState = cursorStates[queryKey];
  const rootCursor = cursorState?.cursor ?? cursorRootsResult.data?.nextCursor ?? undefined;
  const rootHasMore = cursorState?.hasMore ?? Boolean(cursorRootsResult.data?.hasMore);
  const pagedState = pagedStates[queryKey];
  const pagedPage = pagedState?.page ?? 0;
  const pagedHasMore =
    pagedState?.hasMore ?? Boolean(pagedRootsResult.data && pagedRootsResult.data.totalPages > 1);
  const requestedVisibleCount = visibleCounts[queryKey] ?? PAGE_SIZE_STEP;
  const increaseVisibleCount = useCallback(
    () =>
      setVisibleCounts((previous) => ({
        ...previous,
        [queryKey]: (previous[queryKey] ?? PAGE_SIZE_STEP) + PAGE_SIZE_STEP,
      })),
    [queryKey]
  );

  // Local state for pending comments (optimistic UI that haven't been synced to DB yet)
  const [pendingComments, setPendingComments] = useState<EnhancedComment[]>([]);

  // Function to add a pending comment locally
  const addPendingComment = (comment: EnhancedComment) => {
    setPendingComments((prev) => [comment, ...prev]);
  };

  // Function to remove a pending comment or promote it
  const removePendingComment = (id: number) => {
    setPendingComments((prev) => prev.filter((c) => c.id !== id));
  };

  // Function to mark a pending comment as failed
  const markPendingCommentFailed = (id: number) => {
    setPendingComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFailed: true, isPending: false } : c))
    );
  };

  // Enrich & Transform raw comments from RTK query
  const enrichedComments = useMemo(() => {
    const rawComments = rawCommentsList || [];

    function processNode(node: CommentResponse): EnhancedComment | null {
      const processedChildren: EnhancedComment[] = [];
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          const processedChild = processNode(child);
          if (processedChild) {
            processedChildren.push(processedChild);
          }
        }
      }

      const loadedReplies = replyPages[node.id]?.comments ?? [];
      for (const child of loadedReplies) {
        const processedChild = processNode(child);
        if (
          processedChild &&
          !processedChildren.some((existing) => existing.id === processedChild.id)
        ) {
          processedChildren.push(processedChild);
        }
      }

      processedChildren.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      return {
        id: node.id,
        parentId: node.parentId || null,
        content: node.content,
        username: node.username || "Anonymous",
        nickname: node.nickname || node.username || "Anonymous",
        avatar: node.avatar || "",
        status: (node.status as EnhancedComment["status"]) || "APPROVED",
        postId: node.postId || postId,
        postTitle: node.postTitle || "",
        createdAt: node.createdAt,
        editedAt: node.editedAt || null,
        likesCount: node.likesCount || 0,
        reportsCount: node.reportsCount || 0,
        replyCount: node.replyCount || 0,
        likedByCurrentUser: node.likedByCurrentUser || false,
        pinned: node.pinned || false,
        featured: node.featured || false,
        deletedPlaceholder: node.deletedPlaceholder || false,
        children: processedChildren,
      };
    }

    const processedRoots: EnhancedComment[] = [];
    for (const raw of rawComments) {
      const processed = processNode(raw);
      if (processed) {
        processedRoots.push(processed);
      }
    }

    // Merge in local pending comments that belong to root (parentId === null)
    const rootPending = pendingComments.filter((c) => c.parentId === null);
    const rawIds = new Set(processedRoots.map((c) => c.id));
    const filteredPending = rootPending.filter(
      (c) => c.isPending || c.isFailed || !rawIds.has(c.id)
    );

    const allRoots = [...filteredPending, ...processedRoots];

    // Keep optimistic replies visible until the canonical tree is refetched.
    const inlineReplies = pendingComments.filter((c) => c.parentId !== null);
    const injectReplies = (nodes: EnhancedComment[]): EnhancedComment[] =>
      nodes.map((node) => {
        const repliesForThisNode = inlineReplies.filter((reply) => reply.parentId === node.id);
        const existingIds = new Set(node.children.map((child) => child.id));
        const uniqueReplies = repliesForThisNode.filter((reply) => !existingIds.has(reply.id));

        return {
          ...node,
          children: injectReplies([...node.children, ...uniqueReplies]),
        };
      });

    const rootsWithPendingReplies = inlineReplies.length > 0 ? injectReplies(allRoots) : allRoots;

    // Apply Sorting to Top-Level Roots
    rootsWithPendingReplies.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOrder === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOrder === "likes") {
        if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? -1 : 1;
        if (Boolean(b.featured) !== Boolean(a.featured)) return b.featured ? -1 : 1;
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      return 0;
    });

    return rootsWithPendingReplies;
  }, [rawCommentsList, pendingComments, replyPages, sortOrder, postId]);

  const highlightedRootIndex = highlightedCommentId
    ? enrichedComments.findIndex((comment) => {
        if (comment.id === highlightedCommentId) return true;
        const findInTree = (node: EnhancedComment): boolean =>
          node.id === highlightedCommentId || node.children.some(findInTree);
        return findInTree(comment);
      })
    : -1;
  const visibleCount = Math.max(
    requestedVisibleCount,
    highlightedRootIndex >= requestedVisibleCount
      ? Math.ceil((highlightedRootIndex + 1) / PAGE_SIZE_STEP) * PAGE_SIZE_STEP
      : 0
  );

  const loadMore = useCallback(async () => {
    if (enrichedComments.length > visibleCount) {
      increaseVisibleCount();
      return;
    }

    if (!useCursorRoots && !pagedHasMore) {
      increaseVisibleCount();
      return;
    }

    if (!useCursorRoots) {
      const nextPage = pagedPage + 1;
      const result = isGuestbook
        ? sortOrder === "likes"
          ? await loadGuestbookHotRoots({ page: nextPage, size: PAGE_SIZE }).unwrap()
          : await loadGuestbookPagedRoots({
              page: nextPage,
              size: PAGE_SIZE,
              sort: ["createdAt,asc"],
            }).unwrap()
        : sortOrder === "likes"
          ? await loadPostHotRoots({ postId, page: nextPage, size: PAGE_SIZE }).unwrap()
          : await loadPostPagedRoots({
              postId,
              page: nextPage,
              size: PAGE_SIZE,
              sort: ["createdAt,asc"],
            }).unwrap();
      setAdditionalRoots((previous) => {
        const existing = new Set((previous[queryKey] ?? []).map((comment) => comment.id));
        return {
          ...previous,
          [queryKey]: [
            ...(previous[queryKey] ?? []),
            ...result.list.filter((comment) => !existing.has(comment.id)),
          ],
        };
      });
      setPagedStates((previous) => ({
        ...previous,
        [queryKey]: { page: nextPage, hasMore: result.page < result.totalPages },
      }));
      increaseVisibleCount();
      return;
    }

    if (!rootHasMore || !rootCursor) {
      increaseVisibleCount();
      return;
    }

    const result = isGuestbook
      ? await loadGuestbookRoots({ cursor: rootCursor, size: PAGE_SIZE }).unwrap()
      : await loadPostRoots({ postId, cursor: rootCursor, size: PAGE_SIZE }).unwrap();
    setAdditionalRoots((previous) => {
      const existingIds = new Set((previous[queryKey] ?? []).map((comment) => comment.id));
      return {
        ...previous,
        [queryKey]: [
          ...(previous[queryKey] ?? []),
          ...result.list.filter((comment) => !existingIds.has(comment.id)),
        ],
      };
    });
    setCursorStates((previous) => ({
      ...previous,
      [queryKey]: { cursor: result.nextCursor ?? undefined, hasMore: result.hasMore },
    }));
    increaseVisibleCount();
  }, [
    isGuestbook,
    loadGuestbookHotRoots,
    loadGuestbookPagedRoots,
    loadGuestbookRoots,
    loadPostHotRoots,
    loadPostPagedRoots,
    loadPostRoots,
    increaseVisibleCount,
    enrichedComments.length,
    pagedHasMore,
    pagedPage,
    postId,
    queryKey,
    rootCursor,
    rootHasMore,
    sortOrder,
    useCursorRoots,
    visibleCount,
  ]);

  const loadReplies = useCallback(
    async (parentId: number) => {
      if (loadingReplyIds.has(parentId)) return;
      const current = replyPages[parentId];
      if (current && !current.hasMore) return;

      setLoadingReplyIds((previous) => new Set(previous).add(parentId));
      try {
        const result = await loadRepliesQuery({
          parentId,
          cursor: current?.nextCursor ?? undefined,
          size: PAGE_SIZE,
        }).unwrap();
        setReplyPages((previous) => {
          const existing = previous[parentId];
          const existingIds = new Set(existing?.comments.map((comment) => comment.id) ?? []);
          return {
            ...previous,
            [parentId]: {
              comments: [
                ...(existing?.comments ?? []),
                ...result.list.filter((comment) => !existingIds.has(comment.id)),
              ],
              nextCursor: result.nextCursor,
              hasMore: result.hasMore,
            },
          };
        });
      } finally {
        setLoadingReplyIds((previous) => {
          const next = new Set(previous);
          next.delete(parentId);
          return next;
        });
      }
    },
    [loadRepliesQuery, loadingReplyIds, replyPages]
  );

  // Load More logic
  const paginatedComments = useMemo(() => {
    return enrichedComments.slice(0, visibleCount);
  }, [enrichedComments, visibleCount]);

  const hasMore = useCursorRoots
    ? rootHasMore
    : enrichedComments.length > visibleCount || pagedHasMore;

  const resetVisible = useCallback(
    () => setVisibleCounts((previous) => ({ ...previous, [queryKey]: PAGE_SIZE_STEP })),
    [queryKey]
  );

  const totalComments = enrichedComments.length;
  const pendingRootCount = pendingComments.reduce(
    (count, comment) => count + (comment.parentId === null ? 1 : 0),
    0
  );
  const canonicalCommentsCount = Math.max(0, totalComments - pendingRootCount);

  return {
    comments: paginatedComments,
    allCommentsCount: enrichedComments.length,
    backendTotal: canonicalCommentsCount,
    isLoading,
    isFetching,
    error,
    hasMore,
    loadMore,
    refetch,
    resetVisible,
    addPendingComment,
    removePendingComment,
    markPendingCommentFailed,
    pendingComments,
    loadReplies,
    loadingReplyIds,
    hasMoreReplies: (parentId: number) => replyPages[parentId]?.hasMore ?? false,
  };
}
