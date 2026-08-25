"use client";

import { toast } from "@heroui/react";
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

interface MutationHookProps {
  addPendingComment: (c: EnhancedComment) => void;
  removePendingComment: (id: number) => void;
  markPendingCommentFailed: (id: number) => void;
  refetch: () => Promise<unknown>;
}

export function useCommentMutations({
  addPendingComment,
  removePendingComment,
  markPendingCommentFailed,
  refetch,
}: MutationHookProps) {
  const { isGuestbook, postId, currentUser, isAuthenticated } = useCommentContext();
  const [publishCommentApi] = usePublishCommentMutation();
  const [postGuestbookEntryApi] = usePostGuestbookEntryMutation();
  const [editMyCommentApi] = useEditMyCommentMutation();
  const [deleteMyCommentApi] = useDeleteMyCommentMutation();
  const [likeCommentApi] = useLikeCommentMutation();
  const [unlikeCommentApi] = useUnlikeCommentMutation();
  const [reportCommentApi] = useReportCommentMutation();

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
  ) => {
    if (!isAuthenticated) {
      toast.warning("Please sign in to post a comment.");
      return;
    }

    const tempId = existingTempId || -Date.now();

    if (existingTempId) {
      // Re-mark it as pending
      removePendingComment(tempId);
    }

    const optimistic = createOptimisticComment(tempId, content, parentId);
    addPendingComment(optimistic);

    try {
      if (isGuestbook) {
        await postGuestbookEntryApi({
          content,
          parentId: parentId || undefined,
        }).unwrap();
      } else {
        await publishCommentApi({
          content,
          postId,
          parentId: parentId || undefined,
        }).unwrap();
      }

      // The backend is the only durable source. Pending comments disappear until
      // moderation makes them visible through the canonical read endpoint.
      removePendingComment(tempId);
    } catch (err) {
      console.error("Comment submission failed, keeping in local failed list:", err);
      markPendingCommentFailed(tempId);
    }
  };

  // 2. RETRY (Retry a failed local comment)
  const retryPublishComment = async (tempId: number, content: string, parentId: number | null) => {
    await publishComment(content, parentId, tempId);
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
      await refetch();
    } catch (err) {
      console.error("Failed to sync comment edit:", err);
    }
  };

  // 5. DELETE COMMENT
  const deleteComment = async (id: number) => {
    try {
      await deleteMyCommentApi(id).unwrap();
      await refetch();
    } catch (err) {
      console.error("Failed to sync comment deletion:", err);
    }
  };

  // 6. REPORT COMMENT
  const reportComment = async (id: number) => {
    try {
      await reportCommentApi({ id, reason: "inappropriate" }).unwrap();
      await refetch();
    } catch (err) {
      console.error("Failed to sync comment report:", err);
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
