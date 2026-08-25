"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import { useAppSelector } from "@/lib/hooks";

export type SortOrder = "newest" | "oldest" | "likes";

interface CommentContextType {
  postId: number;
  isGuestbook: boolean;
  activeReplyId: number | null;
  setActiveReplyId: (id: number | null) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  isAuthenticated: boolean;
  currentUser: string | null;
  highlightedCommentId: number | null;
  setHighlightedCommentId: (id: number | null) => void;
  hasUnsavedDraft: boolean;
  setHasUnsavedDraft: (hasDraft: boolean) => void;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

export function CommentProvider({
  postId,
  isGuestbook = false,
  children,
}: {
  postId: number;
  isGuestbook?: boolean;
  children: React.ReactNode;
}) {
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState<boolean>(false);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);

  return (
    <CommentContext.Provider
      value={{
        postId,
        isGuestbook,
        activeReplyId,
        setActiveReplyId,
        sortOrder,
        setSortOrder,
        isAuthenticated,
        currentUser,
        highlightedCommentId,
        setHighlightedCommentId,
        hasUnsavedDraft,
        setHasUnsavedDraft,
      }}
    >
      {children}
    </CommentContext.Provider>
  );
}

export function useCommentContext() {
  const context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error("useCommentContext must be used within a CommentProvider");
  }
  return context;
}
