"use client";

import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";
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
}

interface CommentSortContextType {
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);
const CommentSortContext = createContext<CommentSortContextType | undefined>(undefined);

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

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const contextValue = useMemo(
    () => ({
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
    }),
    [
      activeReplyId,
      currentUser,
      highlightedCommentId,
      isAuthenticated,
      isGuestbook,
      postId,
      sortOrder,
    ]
  );
  const sortContextValue = useMemo(() => ({ sortOrder, setSortOrder }), [sortOrder]);

  return (
    <CommentContext.Provider value={contextValue}>
      <CommentSortContext.Provider value={sortContextValue}>{children}</CommentSortContext.Provider>
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

export function useCommentSortContext() {
  const context = useContext(CommentSortContext);
  if (context === undefined) {
    throw new Error("useCommentSortContext must be used within a CommentProvider");
  }
  return context;
}
