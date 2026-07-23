"use client";

import { useEffect, useCallback } from "react";
import { useCommentContext } from "../context/comment-context";

export function useCommentHighlight() {
  const { setHighlightedCommentId } = useCommentContext();

  const handleHashChange = useCallback(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash && hash.startsWith("#comment-")) {
      const idStr = hash.replace("#comment-", "");
      const id = parseInt(idStr, 10);
      if (!isNaN(id)) {
        setHighlightedCommentId(id);

        // Find the element and scroll to it with delay to ensure DOM has rendered
        setTimeout(() => {
          const el = document.getElementById(`comment-card-${id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
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
