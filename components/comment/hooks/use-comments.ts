"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyInteractionOverrides,
  nextLikePatch,
  type CommentAnchorContextResponse,
  type CommentLikePatch,
  type CommentPublishResponse,
} from "@/lib/features/comment";
import { commentDebug } from "@/lib/comment-debug";
import { useCommentContext, useCommentSortContext } from "../context/comment-context";
import type { EnhancedComment } from "../types";
import {
  findRootIndexForComment,
  mergePendingIntoRoots,
  nextCursorFromCommentIds,
  normalizeCommentTree,
  pageResultHasMore,
} from "../utils/thread";
import { useCommentFreshness } from "./use-comment-freshness";
import { useCommentReplies } from "./use-comment-replies";
import { useCommentRoots } from "./use-comment-roots";

const EMPTY_PENDING: EnhancedComment[] = [];
const EMPTY_LIKES: Record<number, CommentLikePatch> = {};

export function useComments() {
  const { isGuestbook, isMoment, postId, momentId, highlightedCommentId } = useCommentContext();
  const { sortOrder } = useCommentSortContext();
  const threadKey = isGuestbook ? "guestbook" : isMoment ? `moment:${momentId}` : `post:${postId}`;

  const {
    queryKey,
    rawCommentsList,
    baseCount,
    newestSeenId,
    isLoading,
    isFetching,
    error,
    refetch,
    remoteTotal,
    hasMore,
    loadMore,
    prependRoots,
    ensureRoot,
  } = useCommentRoots({ isGuestbook, isMoment, postId, momentId, sortOrder });

  const {
    replyPages,
    loadingReplyIds,
    loadReplies,
    hasMoreReplies,
    seedReplies,
    patchReply,
    removeReply,
  } = useCommentReplies({ threadKey });

  const [pendingByThread, setPendingByThread] = useState<Record<string, EnhancedComment[]>>({});
  const [likeOverridesByThread, setLikeOverridesByThread] = useState<
    Record<string, Record<number, CommentLikePatch>>
  >({});

  const pendingComments = useMemo(
    () => pendingByThread[threadKey] ?? EMPTY_PENDING,
    [pendingByThread, threadKey]
  );
  const likeOverrides = useMemo(
    () => likeOverridesByThread[threadKey] ?? EMPTY_LIKES,
    [likeOverridesByThread, threadKey]
  );

  const updatePending = useCallback(
    (updater: (previous: EnhancedComment[]) => EnhancedComment[]) => {
      setPendingByThread((previous) => ({
        ...previous,
        [threadKey]: updater(previous[threadKey] ?? []),
      }));
    },
    [threadKey]
  );

  const addPendingComment = (comment: EnhancedComment) => {
    updatePending((prev) => [comment, ...prev]);
  };

  const markPendingCommentFailed = (id: number) => {
    updatePending((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFailed: true, isPending: false } : c))
    );
  };

  const markPendingCommentSubmitted = (
    tempId: number,
    submission: CommentPublishResponse | null
  ) => {
    updatePending((prev) =>
      prev.map((comment) => {
        if (comment.id !== tempId) return comment;
        // Idempotent/empty publish payloads must not freeze a temp row as
        // "Awaiting review" beside the real server comment after refetch.
        if (!submission?.id) {
          return {
            ...comment,
            isFailed: false,
            isPending: false,
            status: comment.status ?? "PENDING",
          };
        }
        return {
          ...comment,
          id: submission.id,
          isFailed: false,
          isPending: false,
          status: submission.status ?? "PENDING",
        };
      })
    );
  };

  const markPendingCommentRetrying = (id: number) => {
    updatePending((prev) =>
      prev.map((comment) =>
        comment.id === id ? { ...comment, isFailed: false, isPending: true } : comment
      )
    );
  };

  const applyLikeOverride = useCallback(
    (id: number, currentLiked: boolean, currentCount: number, liked: boolean) => {
      const patch = nextLikePatch(currentLiked, currentCount, liked);
      setLikeOverridesByThread((previous) => ({
        ...previous,
        [threadKey]: { ...(previous[threadKey] ?? {}), [id]: patch },
      }));
      return patch;
    },
    [threadKey]
  );

  const revertLikeOverride = useCallback(
    (id: number, snapshot: CommentLikePatch) => {
      setLikeOverridesByThread((previous) => ({
        ...previous,
        [threadKey]: { ...(previous[threadKey] ?? {}), [id]: snapshot },
      }));
    },
    [threadKey]
  );

  const enrichedComments = useMemo(() => {
    const processedRoots = rawCommentsList.map((raw) => {
      const normalized = normalizeCommentTree(raw, { postId, replyPages });
      return applyInteractionOverrides(normalized, likeOverrides) as EnhancedComment;
    });
    const merged = mergePendingIntoRoots(processedRoots, pendingComments, sortOrder);
    return merged.map((root) => applyInteractionOverrides(root, likeOverrides) as EnhancedComment);
  }, [rawCommentsList, pendingComments, replyPages, sortOrder, postId, likeOverrides]);

  const hasComment = useCallback(
    (commentId: number) => findRootIndexForComment(enrichedComments, commentId) >= 0,
    [enrichedComments]
  );

  const applyAnchorContext = useCallback(
    (context: CommentAnchorContextResponse) => {
      ensureRoot(context.rootComment);

      const seeded = [...context.repliesWindow.list];
      if (
        context.targetComment.id !== context.rootCommentId &&
        !seeded.some((comment) => comment.id === context.targetComment.id)
      ) {
        seeded.push(context.targetComment);
      }

      const hasMoreRepliesWindow = pageResultHasMore(
        context.repliesWindow.page,
        context.repliesWindow.totalPages
      );
      seedReplies(context.rootCommentId, seeded, {
        replace: true,
        hasMore: hasMoreRepliesWindow,
        nextCursor: hasMoreRepliesWindow ? nextCursorFromCommentIds(seeded) : null,
      });
    },
    [ensureRoot, seedReplies]
  );

  const { newCount, isLoadingNew, loadNewComments } = useCommentFreshness({
    isGuestbook,
    isMoment,
    postId,
    momentId,
    sortOrder,
    newestSeenId,
    onPrefetchRoots: prependRoots,
  });

  const isInitialCountLoading = isLoading && remoteTotal === undefined;
  const canonicalCommentsCount = Math.max(0, remoteTotal ?? 0, enrichedComments.length);

  useEffect(() => {
    commentDebug("query:state", {
      queryKey,
      isLoading,
      isFetching,
      error: Boolean(error),
      baseCount,
      enrichedCount: enrichedComments.length,
      pendingCount: pendingComments.length,
      totalCount: canonicalCommentsCount,
      isInitialCountLoading,
      newCount,
      highlightedCommentId,
    });
  }, [
    baseCount,
    canonicalCommentsCount,
    enrichedComments.length,
    error,
    highlightedCommentId,
    isFetching,
    isLoading,
    isInitialCountLoading,
    newCount,
    pendingComments.length,
    queryKey,
  ]);

  return {
    comments: enrichedComments,
    allCommentsCount: enrichedComments.length,
    totalCount: canonicalCommentsCount,
    isInitialCountLoading,
    isLoading,
    isFetching,
    error,
    hasMore,
    loadMore,
    refetch,
    addPendingComment,
    markPendingCommentSubmitted,
    markPendingCommentRetrying,
    markPendingCommentFailed,
    pendingComments,
    loadReplies,
    loadingReplyIds,
    hasMoreReplies,
    applyLikeOverride,
    revertLikeOverride,
    patchReply,
    removeReply,
    hasComment,
    applyAnchorContext,
    newCount,
    isLoadingNew,
    loadNewComments,
  };
}
