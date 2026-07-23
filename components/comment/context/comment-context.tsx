"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAppSelector } from "@/lib/hooks";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth/auth-slice";
import { simulationStore, EnhancedComment } from "../hooks/simulation-store";

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
  newCommentCount: number;
  setNewCommentCount: (count: number) => void;
  hasUnsavedDraft: boolean;
  setHasUnsavedDraft: (hasDraft: boolean) => void;

  // React state memory-driven simulation store to avoid synchronous localStorage reads on render
  likes: Record<number, { count: number; isLiked: boolean }>;
  setLikes: React.Dispatch<
    React.SetStateAction<Record<number, { count: number; isLiked: boolean }>>
  >;
  edits: Record<number, string>;
  setEdits: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  deletions: number[];
  setDeletions: React.Dispatch<React.SetStateAction<number[]>>;
  reports: number[];
  setReports: React.Dispatch<React.SetStateAction<number[]>>;
  localComments: EnhancedComment[];
  setLocalComments: React.Dispatch<React.SetStateAction<EnhancedComment[]>>;
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
  const [newCommentCount, setNewCommentCount] = useState<number>(0);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState<boolean>(false);

  // Simulated Storage memory state
  const [likes, setLikes] = useState<Record<number, { count: number; isLiked: boolean }>>({});
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [deletions, setDeletions] = useState<number[]>([]);
  const [reports, setReports] = useState<number[]>([]);
  const [localComments, setLocalComments] = useState<EnhancedComment[]>([]);

  // Load from simulation store exactly once on mount (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      setLikes({}); // Initialize as empty to respect backend-driven values
      setEdits({});
      setDeletions([]);
      setReports([]);
      setLocalComments(simulationStore.getLocalComments(postId));
    }, 0);
    return () => clearTimeout(timer);
  }, [postId]);

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
        newCommentCount,
        setNewCommentCount,
        hasUnsavedDraft,
        setHasUnsavedDraft,

        // Expose state and setters
        likes,
        setLikes,
        edits,
        setEdits,
        deletions,
        setDeletions,
        reports,
        setReports,
        localComments,
        setLocalComments,
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
