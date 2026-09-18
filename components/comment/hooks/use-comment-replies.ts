"use client";

import { useCallback, useMemo, useState } from "react";
import { useLazyGetCommentRepliesCursorQuery, type CommentResponse } from "@/lib/features/comment";

const PAGE_SIZE = 20;

export interface ReplyPage {
  comments: CommentResponse[];
  nextCursor: number | null;
  hasMore: boolean;
}

const EMPTY_REPLY_PAGES: Record<number, ReplyPage> = {};
const EMPTY_LOADING_IDS = new Set<number>();

export type SeedRepliesOptions = {
  hasMore?: boolean;
  nextCursor?: number | null;
  /** Replace existing page instead of merging (used by permalink context). */
  replace?: boolean;
};

interface UseCommentRepliesArgs {
  threadKey: string;
}

export function useCommentReplies({ threadKey }: UseCommentRepliesArgs) {
  const [replyPagesByThread, setReplyPagesByThread] = useState<
    Record<string, Record<number, ReplyPage>>
  >({});
  const [loadingReplyIdsByThread, setLoadingReplyIdsByThread] = useState<
    Record<string, Set<number>>
  >({});
  const [loadRepliesQuery] = useLazyGetCommentRepliesCursorQuery();

  const replyPages = useMemo(
    () => replyPagesByThread[threadKey] ?? EMPTY_REPLY_PAGES,
    [replyPagesByThread, threadKey]
  );
  const loadingReplyIds = useMemo(
    () => loadingReplyIdsByThread[threadKey] ?? EMPTY_LOADING_IDS,
    [loadingReplyIdsByThread, threadKey]
  );

  const loadReplies = useCallback(
    async (parentId: number) => {
      if (loadingReplyIds.has(parentId)) return;
      const current = replyPages[parentId];
      if (current && !current.hasMore) return;

      setLoadingReplyIdsByThread((previous) => {
        const next = new Set(previous[threadKey] ?? []);
        next.add(parentId);
        return { ...previous, [threadKey]: next };
      });
      try {
        const result = await loadRepliesQuery({
          parentId,
          cursor: current?.nextCursor ?? undefined,
          size: PAGE_SIZE,
        }).unwrap();
        setReplyPagesByThread((previous) => {
          const threadPages = previous[threadKey] ?? {};
          const existing = threadPages[parentId];
          const existingIds = new Set(existing?.comments.map((comment) => comment.id) ?? []);
          return {
            ...previous,
            [threadKey]: {
              ...threadPages,
              [parentId]: {
                comments: [
                  ...(existing?.comments ?? []),
                  ...result.list.filter((comment) => !existingIds.has(comment.id)),
                ],
                nextCursor: result.nextCursor,
                hasMore: result.hasMore,
              },
            },
          };
        });
      } finally {
        setLoadingReplyIdsByThread((previous) => {
          const next = new Set(previous[threadKey] ?? []);
          next.delete(parentId);
          return { ...previous, [threadKey]: next };
        });
      }
    },
    [loadRepliesQuery, loadingReplyIds, replyPages, threadKey]
  );

  const hasMoreReplies = useCallback(
    (parentId: number) => replyPages[parentId]?.hasMore ?? false,
    [replyPages]
  );

  const seedReplies = useCallback(
    (parentId: number, comments: CommentResponse[], options: SeedRepliesOptions = {}) => {
      const { hasMore = false, nextCursor = null, replace = false } = options;

      setReplyPagesByThread((previous) => {
        const threadPages = previous[threadKey] ?? {};
        if (replace || !threadPages[parentId]) {
          return {
            ...previous,
            [threadKey]: {
              ...threadPages,
              [parentId]: { comments, nextCursor, hasMore },
            },
          };
        }

        const existing = threadPages[parentId];
        const existingIds = new Set(existing.comments.map((comment) => comment.id));
        const incoming = comments.filter((comment) => !existingIds.has(comment.id));
        return {
          ...previous,
          [threadKey]: {
            ...threadPages,
            [parentId]: {
              comments: [...existing.comments, ...incoming],
              nextCursor: nextCursor ?? existing.nextCursor,
              hasMore,
            },
          },
        };
      });
    },
    [threadKey]
  );

  const patchReply = useCallback(
    (commentId: number, content: string) => {
      setReplyPagesByThread((previous) => {
        const threadPages = previous[threadKey];
        if (!threadPages) return previous;
        let changed = false;
        const next: Record<number, ReplyPage> = {};
        for (const [parentId, page] of Object.entries(threadPages)) {
          const comments = page.comments.map((comment) => {
            if (comment.id !== commentId) return comment;
            changed = true;
            return { ...comment, content, editedAt: new Date().toISOString() };
          });
          next[Number(parentId)] = { ...page, comments };
        }
        return changed ? { ...previous, [threadKey]: next } : previous;
      });
    },
    [threadKey]
  );

  const removeReply = useCallback(
    (commentId: number) => {
      setReplyPagesByThread((previous) => {
        const threadPages = previous[threadKey];
        if (!threadPages) return previous;
        let changed = false;
        const next: Record<number, ReplyPage> = {};
        for (const [parentId, page] of Object.entries(threadPages)) {
          const comments = page.comments.filter((comment) => comment.id !== commentId);
          if (comments.length !== page.comments.length) changed = true;
          next[Number(parentId)] = { ...page, comments };
        }
        return changed ? { ...previous, [threadKey]: next } : previous;
      });
    },
    [threadKey]
  );

  return {
    replyPages,
    loadingReplyIds,
    loadReplies,
    hasMoreReplies,
    seedReplies,
    patchReply,
    removeReply,
  };
}
