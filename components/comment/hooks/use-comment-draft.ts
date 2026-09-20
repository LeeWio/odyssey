"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DRAFT_PREFIX = "odyssey:comment-draft";

/** `threadKey` should match comment hooks: guestbook | moment:{id} | post:{id} */
export function useCommentDraft(threadKey: string, replyId: number | null) {
  const replyPart = replyId === null ? "root" : `reply-${replyId}`;
  const storageKey = `${DRAFT_PREFIX}:${threadKey}:${replyPart}`;
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  // Event handlers and hydration share the latest value, including updates React
  // has not rendered yet. Each thread/reply keeps its own in-memory fallback.
  const currentDrafts = useRef<Record<string, string>>({});

  const rememberDraft = useCallback((key: string, value: string) => {
    currentDrafts.current = { ...currentDrafts.current, [key]: value };
    setDrafts(currentDrafts.current);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Typing or clearing before hydration takes precedence over saved text.
      if (Object.hasOwn(currentDrafts.current, storageKey)) return;
      let stored = "";
      try {
        stored = window.localStorage.getItem(storageKey) ?? "";
      } catch {
        // Storage may be blocked; the composer must remain usable in memory.
      }
      rememberDraft(storageKey, stored);
    }, 0);
    return () => clearTimeout(timer);
  }, [rememberDraft, storageKey]);

  const setDraft = useCallback(
    (value: string) => {
      rememberDraft(storageKey, value);
      try {
        if (value.trim()) {
          window.localStorage.setItem(storageKey, value);
        } else {
          window.localStorage.removeItem(storageKey);
        }
      } catch {
        // Quota and privacy restrictions must not discard the in-memory draft.
      }
    },
    [rememberDraft, storageKey]
  );

  // A completed submission must not erase edits made while it was in flight.
  const clearDraft = useCallback(
    (submittedDraft?: string) => {
      if (submittedDraft !== undefined && currentDrafts.current[storageKey] !== submittedDraft) {
        return false;
      }
      setDraft("");
      return true;
    },
    [setDraft, storageKey]
  );

  return [
    drafts[storageKey] ?? "",
    setDraft,
    clearDraft,
    Object.hasOwn(drafts, storageKey),
  ] as const;
}
