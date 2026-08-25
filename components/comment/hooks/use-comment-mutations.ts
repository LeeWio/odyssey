"use client";

import { toast } from "@heroui/react";
import { useRef } from "react";
import {
  useDeleteMyCommentMutation,
  useEditMyCommentMutation,
  useLikeCommentMutation,
  usePostGuestbookEntryMutation,
  usePublishCommentMutation,
  useReportCommentMutation,
  useUnlikeCommentMutation,
} from "@/lib/features/comment";
import { useCommentContext } from "../context/comment-context";
import type { EnhancedComment } from "../types";
import { commentDebug } from "@/lib/comment-debug";

interface MutationHookProps {
  addPendingComment: (c: EnhancedComment) => void;
  markPendingCommentSubmitted: (id: number) => void;
  markPendingCommentFailed: (id: number) => void;
  markPendingCommentRetrying: (id: number) => void;
}

export function useCommentMutations({
  addPendingComment,
  markPendingCommentSubmitted,
  markPendingCommentFailed,
  markPendingCommentRetrying,
}: MutationHookProps) {
  const { isGuestbook, postId, currentUser, isAuthenticated } = useCommentContext();
  const [publishCommentApi] = usePublishCommentMutation();
  const [postGuestbookEntryApi] = usePostGuestbookEntryMutation();
  const [editMyCommentApi] = useEditMyCommentMutation();
  const [deleteMyCommentApi] = useDeleteMyCommentMutation();
  const [likeCommentApi] = useLikeCommentMutation();
  const [unlikeCommentApi] = useUnlikeCommentMutation();
  const [reportCommentApi] = useReportCommentMutation();
  const idempotencyKeys = useRef(new Map<number, string>());
  const tempIdSequence = useRef(0);

  const createIdempotencyKey = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  // Helper to construct optimistic comment
  const createOptimisticComment = (
    tempId: number,
    content: string,
    parentId: number | null
  ): EnhancedComment => {
    return {
      id: tempId,
      parentId,
      content,
      username: currentUser || "Anonymous",
      nickname: currentUser || "Anonymous",
      avatar: "",
      status: "PENDING",
      postId,
      createdAt: new Date().toISOString(),
      children: [],
      likesCount: 0,
      reportsCount: 0,
      replyCount: 0,
      likedByCurrentUser: false,
      pinned: false,
      featured: false,
      deletedPlaceholder: false,
      editedAt: null,
      isPending: true,
    };
  };

  // 1. PUBLISH (Real API + Local Optimistic UI)
  const publishComment = async (
    content: string,
    parentId: number | null = null,
    existingTempId?: number
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.warning("Please sign in to post a comment.");
      return false;
    }

    if (!isGuestbook && postId <= 0) {
      toast.danger("This comment thread is unavailable.");
      return false;
    }

    const tempId = existingTempId ?? -(Date.now() * 1000 + (tempIdSequence.current++ % 1000));
    const idempotencyKey = idempotencyKeys.current.get(tempId) ?? createIdempotencyKey();
    idempotencyKeys.current.set(tempId, idempotencyKey);
    commentDebug("mutation:publish-start", { postId, parentId, tempId, isGuestbook });

    if (existingTempId) {
      markPendingCommentRetrying(tempId);
    } else {
      const optimistic = createOptimisticComment(tempId, content, parentId);
      addPendingComment(optimistic);
    }

    try {
      if (isGuestbook) {
        await postGuestbookEntryApi({
          content,
          parentId: parentId || undefined,
          idempotencyKey,
        }).unwrap();
      } else {
        await publishCommentApi({
          content,
          postId,
          parentId: parentId || undefined,
          idempotencyKey,
        }).unwrap();
      }

      commentDebug("mutation:publish-api-resolved", { postId, parentId, tempId });
      // Keep the locally submitted comment visible while moderation and the
      // invalidated canonical query settle. The backend remains the durable source.
      markPendingCommentSubmitted(tempId);
      idempotencyKeys.current.delete(tempId);
      commentDebug("mutation:publish-marked-submitted", { postId, parentId, tempId });
      return true;
    } catch (err) {
      commentDebug("mutation:publish-api-rejected", {
        postId,
        parentId,
        tempId,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error("Comment submission failed, keeping in local failed list:", err);
      markPendingCommentFailed(tempId);
      return false;
    }
  };

  // 2. RETRY (Retry a failed local comment)
  const retryPublishComment = async (
    tempId: number,
    content: string,
    parentId: number | null
  ): Promise<boolean> => {
    return publishComment(content, parentId, tempId);
  };

  // 3. TOGGLE LIKE (Nexus is the source of truth)
  const toggleLike = async (id: number, currentIsLiked: boolean) => {
    const nextLiked = !currentIsLiked;

    try {
      if (nextLiked) {
        await likeCommentApi(id).unwrap();
      } else {
        await unlikeCommentApi(id).unwrap();
      }
    } catch (err) {
      console.error("Failed to sync comment like state:", err);
      toast.danger("Couldn't update comment reaction.");
    }
  };

  // 4. EDIT COMMENT
  const editComment = async (id: number, newContent: string) => {
    try {
      await editMyCommentApi({ id, content: newContent }).unwrap();
      return true;
    } catch (err) {
      console.error("Failed to sync comment edit:", err);
      return false;
    }
  };

  // 5. DELETE COMMENT
  const deleteComment = async (id: number) => {
    try {
      await deleteMyCommentApi(id).unwrap();
      return true;
    } catch (err) {
      console.error("Failed to sync comment deletion:", err);
      return false;
    }
  };

  // 6. REPORT COMMENT
  const reportComment = async (id: number) => {
    try {
      await reportCommentApi({ id, reason: "inappropriate" }).unwrap();
      return true;
    } catch (err) {
      console.error("Failed to sync comment report:", err);
      return false;
    }
  };

  return {
    publishComment,
    retryPublishComment,
    toggleLike,
    editComment,
    deleteComment,
    reportComment,
  };
}
