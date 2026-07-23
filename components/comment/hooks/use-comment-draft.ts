"use client";

import { useState, useEffect, useCallback } from "react";

const DRAFT_PREFIX = "odyssey:comment-draft";

export function useCommentDraft(postId: number, replyId: number | null) {
  const getStorageKey = useCallback(() => {
    const replyPart = replyId === null ? "root" : `reply-${replyId}`;
    return `${DRAFT_PREFIX}:${postId}:${replyPart}`;
  }, [postId, replyId]);

  const [draft, _setDraft] = useState<string>("");

  // Load draft on mount/change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = getStorageKey();
    const stored = localStorage.getItem(key);
    const timer = setTimeout(() => {
      _setDraft(stored || "");
    }, 0);
    return () => clearTimeout(timer);
  }, [getStorageKey]);

  const setDraft = useCallback(
    (value: string) => {
      _setDraft(value);
      if (typeof window === "undefined") return;
      const key = getStorageKey();
      if (value.trim()) {
        localStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
      }
    },
    [getStorageKey]
  );

  const clearDraft = useCallback(() => {
    _setDraft("");
    if (typeof window === "undefined") return;
    const key = getStorageKey();
    localStorage.removeItem(key);
  }, [getStorageKey]);

  return [draft, setDraft, clearDraft] as const;
}
