"use client";

import { useCallback, useEffect } from "react";
import { useCommentContext } from "../context/comment-context";

export function useCommentHighlight() {
  const { setHighlightedCommentId } = useCommentContext();

  const handleHashChange = useCallback(() => {
    if (typeof window === "undefined") return;
    const match = window.location.hash.match(/^#comment-(\d+)$/);
    if (!match) {
      setHighlightedCommentId(null);
      return;
    }

    const id = Number(match[1]);
    setHighlightedCommentId(id);
  }, [setHighlightedCommentId]);

  // Monitor initial mount and hash changes
  useEffect(() => {
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [handleHashChange]);
}
