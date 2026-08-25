"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const { isGuestbook, postId, sortOrder, setNewCommentCount, highlightedCommentId } =
    useCommentContext();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE_STEP);
  const [rootPages, setRootPages] = useState<CommentResponse[]>([]);
  const [rootCursor, setRootCursor] = useState<number | undefined>();
  const [rootHasMore, setRootHasMore] = useState(false);
  const [pagedPage, setPagedPage] = useState(0);
  const [pagedHasMore, setPagedHasMore] = useState(false);
  const [replyPages, setReplyPages] = useState<Record<number, ReplyPage>>({});
  const [loadingReplyIds, setLoadingReplyIds] = useState<Set<number>>(new Set());
  const prevTotalCommentsRef = useRef<number>(0);
  const skipNextCountRef = useRef(false);

  const useCursorRoots = sortOrder === "newest";
  const postCommentsResult = useGetPostCommentRootsCursorQuery(
    { postId, size: PAGE_SIZE },
    { skip: isGuestbook || !useCursorRoots }
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
    { skip: isGuestbook || useCursorRoots || sortOrder === "likes" }
  );
  const postHotRootsResult = useGetHotPostCommentRootsQuery(
    { postId, page: 0, size: PAGE_SIZE },
    { skip: isGuestbook || useCursorRoots || sortOrder !== "likes" }
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
  const rawCommentsList = useMemo(
    () => rootPages,
    [rootPages]
  );
  const activeRootsResult = useCursorRoots ? cursorRootsResult : pagedRootsResult;
  const isLoading = activeRootsResult.isLoading;
  const isFetching = activeRootsResult.isFetching;
  const error = activeRootsResult.error;
  const refetch = activeRootsResult.refetch;

  useEffect(() => {
    if (!useCursorRoots) return;
    const data = cursorRootsResult.data;
    const timer = setTimeout(() => {
      setRootPages(data?.list ?? []);
      setRootCursor(data?.nextCursor ?? undefined);
      setRootHasMore(Boolean(data?.hasMore));
      setVisibleCount(PAGE_SIZE_STEP);
      setReplyPages({});
    }, 0);
    return () => clearTimeout(timer);
  }, [cursorRootsResult.data, useCursorRoots]);

  useEffect(() => {
    if (useCursorRoots) return;
    const data = pagedRootsResult.data;
    const timer = setTimeout(() => {
      setRootPages(data?.list ?? []);
      setVisibleCount(PAGE_SIZE_STEP);
      setReplyPages({});
      setPagedPage(0);
      setPagedHasMore(Boolean(data && data.page < data.totalPages));
    }, 0);
    return () => clearTimeout(timer);
  }, [isGuestbook, pagedRootsResult.data, postId, sortOrder, useCursorRoots]);

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
        if (processedChild && !processedChildren.some((existing) => existing.id === processedChild.id)) {
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
    if (inlineReplies.length > 0) {
      const injectReplies = (nodes: EnhancedComment[]) => {
        for (const node of nodes) {
          const repliesForThisNode = inlineReplies.filter((r) => r.parentId === node.id);
          // filter out any replies that might already be in children
          const existingIds = new Set(node.children.map((c) => c.id));
          const uniqueReplies = repliesForThisNode.filter((r) => !existingIds.has(r.id));

          node.children = [...node.children, ...uniqueReplies];

          if (node.children.length > 0) {
            injectReplies(node.children);
          }
        }
      };
      injectReplies(allRoots);
    }

    // Apply Sorting to Top-Level Roots
    allRoots.sort((a, b) => {
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

    return allRoots;
  }, [rawCommentsList, pendingComments, replyPages, sortOrder, postId]);

  const loadMore = useCallback(async () => {
    if (!useCursorRoots && !pagedHasMore) {
      setVisibleCount((prev) => prev + PAGE_SIZE_STEP);
      return;
    }

    if (!useCursorRoots) {
      const nextPage = pagedPage + 1;
      const result = isGuestbook
        ? sortOrder === "likes"
          ? await loadGuestbookHotRoots({ page: nextPage, size: PAGE_SIZE }).unwrap()
          : await loadGuestbookPagedRoots({ page: nextPage, size: PAGE_SIZE, sort: ["createdAt,asc"] }).unwrap()
        : sortOrder === "likes"
          ? await loadPostHotRoots({ postId, page: nextPage, size: PAGE_SIZE }).unwrap()
          : await loadPostPagedRoots({ postId, page: nextPage, size: PAGE_SIZE, sort: ["createdAt,asc"] }).unwrap();
      skipNextCountRef.current = true;
      setRootPages((previous) => [...previous, ...result.list]);
      setPagedPage(nextPage);
      setPagedHasMore(result.page < result.totalPages);
      setVisibleCount((prev) => prev + PAGE_SIZE_STEP);
      return;
    }

    if (!rootHasMore || !rootCursor) {
      setVisibleCount((prev) => prev + PAGE_SIZE_STEP);
      return;
    }

    const result = isGuestbook
      ? await loadGuestbookRoots({ cursor: rootCursor, size: PAGE_SIZE }).unwrap()
      : await loadPostRoots({ postId, cursor: rootCursor, size: PAGE_SIZE }).unwrap();
    skipNextCountRef.current = true;
    setRootPages((previous) => {
      const existingIds = new Set(previous.map((comment) => comment.id));
      return [...previous, ...result.list.filter((comment) => !existingIds.has(comment.id))];
    });
    setRootCursor(result.nextCursor ?? undefined);
    setRootHasMore(result.hasMore);
    setVisibleCount((prev) => prev + PAGE_SIZE_STEP);
  }, [
    isGuestbook,
    loadGuestbookHotRoots,
    loadGuestbookPagedRoots,
    loadGuestbookRoots,
    loadPostHotRoots,
    loadPostPagedRoots,
    loadPostRoots,
    pagedHasMore,
    pagedPage,
    postId,
    rootCursor,
    rootHasMore,
    sortOrder,
    useCursorRoots,
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

  // Track new comments and trigger notifications
  useEffect(() => {
    if (isLoading) return;
    const currentTotal = enrichedComments.filter((c) => !c.isPending && !c.isFailed).length;
    if (skipNextCountRef.current) {
      skipNextCountRef.current = false;
      prevTotalCommentsRef.current = currentTotal;
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (prevTotalCommentsRef.current > 0 && currentTotal > prevTotalCommentsRef.current) {
      const diff = currentTotal - prevTotalCommentsRef.current;
      timer = setTimeout(() => {
        setNewCommentCount(diff);
      }, 0);
    }
    prevTotalCommentsRef.current = currentTotal;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [enrichedComments, isLoading, setNewCommentCount]);

  // Handle Hash Anchoring (if highlighted ID needs to be visible)
  useEffect(() => {
    if (highlightedCommentId) {
      // Find comment position in the enriched list to auto-expand visibleCount if it's currently truncated
      const idx = enrichedComments.findIndex((c) => {
        // Simple search (check roots first)
        if (c.id === highlightedCommentId) return true;
        // Deep search recursively
        const findInTree = (node: EnhancedComment): boolean => {
          if (node.id === highlightedCommentId) return true;
          return node.children.some(findInTree);
        };
        return findInTree(c);
      });

      if (idx !== -1 && idx >= visibleCount) {
        // Expand visible range to make it visible
        const timer = setTimeout(() => {
          setVisibleCount(Math.ceil((idx + 1) / PAGE_SIZE_STEP) * PAGE_SIZE_STEP);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedCommentId, enrichedComments, visibleCount]);

  // Load More logic
  const paginatedComments = useMemo(() => {
    return enrichedComments.slice(0, visibleCount);
  }, [enrichedComments, visibleCount]);

  const hasMore = useCursorRoots ? rootHasMore : enrichedComments.length > visibleCount;

  const resetVisible = () => {
    setVisibleCount(PAGE_SIZE_STEP);
  };

  const totalComments = enrichedComments.length;

  return {
    comments: paginatedComments,
    allCommentsCount: enrichedComments.length,
    backendTotal: totalComments,
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
