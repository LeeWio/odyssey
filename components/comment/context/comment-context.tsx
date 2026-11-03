"use client";

import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import { useGetCurrentUserQuery } from "@/lib/features/user";
import { useAppSelector } from "@/lib/hooks";

export type SortOrder = "newest" | "oldest" | "likes";

export interface CommentComposerTarget {
  id: number;
  name: string;
}

interface CommentContextType {
  postId: number;
  momentId: number;
  isGuestbook: boolean;
  isMoment: boolean;
  activeReplyId: number | null;
  setActiveReplyId: (id: number | null) => void;
  replyTarget: CommentComposerTarget | null;
  setReplyTarget: (target: CommentComposerTarget | null) => void;
  editTarget: CommentComposerTarget | null;
  setEditTarget: (target: CommentComposerTarget | null) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  isAuthenticated: boolean;
  currentUser: string | null;
  currentUserId: number | null;
  highlightedCommentId: number | null;
  setHighlightedCommentId: (id: number | null) => void;
  /** Sheet threads open reply and edit in a nested sheet. Inline threads keep the row composer. */
  useNestedComposer: boolean;
}

interface CommentSortContextType {
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);
const CommentSortContext = createContext<CommentSortContextType | undefined>(undefined);

export function CommentProvider({
  postId = 0,
  momentId = 0,
  isGuestbook = false,
  useNestedComposer = false,
  children,
}: {
  postId?: number;
  momentId?: number;
  isGuestbook?: boolean;
  useNestedComposer?: boolean;
  children: React.ReactNode;
}) {
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyTarget, setReplyTarget] = useState<CommentComposerTarget | null>(null);
  const [editTarget, setEditTarget] = useState<CommentComposerTarget | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const { data: currentUserProfile } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });
  const currentUserId = currentUserProfile?.id ?? null;
  const isMoment = !isGuestbook && momentId > 0;
  const contextValue = useMemo(
    () => ({
      postId,
      momentId,
      isGuestbook,
      isMoment,
      activeReplyId,
      setActiveReplyId,
      replyTarget,
      setReplyTarget,
      editTarget,
      setEditTarget,
      sortOrder,
      setSortOrder,
      isAuthenticated,
      currentUser,
      currentUserId,
      highlightedCommentId,
      setHighlightedCommentId,
      useNestedComposer,
    }),
    [
      activeReplyId,
      currentUser,
      editTarget,
      replyTarget,
      currentUserId,
      highlightedCommentId,
      isAuthenticated,
      isGuestbook,
      isMoment,
      momentId,
      postId,
      sortOrder,
      useNestedComposer,
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
