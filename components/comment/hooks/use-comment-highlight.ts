"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  useLazyGetCommentAnchorContextQuery,
  type CommentAnchorContextResponse,
} from "@/lib/features/comment";
import { useCommentContext } from "../context/comment-context";

interface UseCommentHighlightArgs {
  hasComment: (commentId: number) => boolean;
  onAnchorContext: (context: CommentAnchorContextResponse) => void;
}

export function useCommentHighlight({ hasComment, onAnchorContext }: UseCommentHighlightArgs) {
  const { setHighlightedCommentId } = useCommentContext();
  const [fetchAnchorContext] = useLazyGetCommentAnchorContextQuery();
  const requestedIds = useRef(new Set<number>());

  const resolveAnchor = useCallback(
    async (id: number) => {
      setHighlightedCommentId(id);
      if (hasComment(id) || requestedIds.current.has(id)) return;

      requestedIds.current.add(id);
      try {
        const context = await fetchAnchorContext({ commentId: id }).unwrap();
        onAnchorContext(context);
      } catch (error) {
        console.error("Failed to load comment permalink context:", error);
        requestedIds.current.delete(id);
      }
    },
    [fetchAnchorContext, hasComment, onAnchorContext, setHighlightedCommentId]
  );

  const handleHashChange = useCallback(() => {
    if (typeof window === "undefined") return;
    const match = window.location.hash.match(/^#comment-(\d+)$/);
    if (!match) {
      setHighlightedCommentId(null);
      return;
    }

    void resolveAnchor(Number(match[1]));
  }, [resolveAnchor, setHighlightedCommentId]);

  useEffect(() => {
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [handleHashChange]);
}
