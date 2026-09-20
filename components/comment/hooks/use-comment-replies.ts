"use client";

import { useCallback, useMemo, useState } from "react";
import { useLazyGetCommentRepliesCursorQuery, type CommentResponse } from "@/lib/features/comment";

import { useCommentLoader } from "./use-comment-loader";
import { reconcileCommentDeletion } from "../utils/deletion";
import { reconcileCommentEdit } from "../utils/editing";

const PAGE_SIZE = 20;

export interface ReplyPage {
  comments: CommentResponse[];
  nextCursor: number | null;
  hasMore: boolean;
}

const EMPTY_REPLY_PAGES: Record<number, ReplyPage> = {};

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
  const { pendingKeys, run } = useCommentLoader();
  const [loadRepliesQuery] = useLazyGetCommentRepliesCursorQuery();

  const replyPages = useMemo(
    () => replyPagesByThread[threadKey] ?? EMPTY_REPLY_PAGES,
    [replyPagesByThread, threadKey]
  );
  const loadingReplyIds = useMemo(
    () =>
      new Set(
        [...pendingKeys]
          .filter((key) => key.startsWith(`${threadKey}:`))
          .map((key) => Number(key.slice(threadKey.length + 1)))
      ),
    [pendingKeys, threadKey]
  );

  const loadReplies = useCallback(
    async (parentId: number) => {
      const current = replyPages[parentId];
      if (current && !current.hasMore) return true;

      return run(
        `${threadKey}:${parentId}`,
        async () => {
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
        },
        "Couldn’t load replies. Please try again."
      );
    },
    [loadRepliesQuery, run, replyPages, threadKey]
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
    (commentId: number, content: string, editedAt: string) => {
      setReplyPagesByThread((previous) => {
        const threadPages = previous[threadKey];
        if (!threadPages) return previous;
        let changed = false;
        const next: Record<number, ReplyPage> = {};
        for (const [parentId, page] of Object.entries(threadPages)) {
          const comments = reconcileCommentEdit(page.comments, commentId, content, editedAt);
          if (comments !== page.comments) changed = true;
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
          const comments = reconcileCommentDeletion(page.comments, commentId);
          if (comments !== page.comments) changed = true;
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
