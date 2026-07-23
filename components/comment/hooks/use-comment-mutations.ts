"use client";

import {
  usePublishCommentMutation,
  usePostGuestbookEntryMutation,
  useEditMyCommentMutation,
  useDeleteMyCommentMutation,
  useLikeCommentMutation,
  useUnlikeCommentMutation,
  useReportCommentMutation,
} from "@/lib/features/comment/comment-api";
import { useCommentContext } from "../context/comment-context";
import { simulationStore, EnhancedComment } from "./simulation-store";
import { toast } from "@heroui/react";

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
  const {
    isGuestbook,
    postId,
    currentUser,
    isAuthenticated,
    setLikes,
    setEdits,
    setDeletions,
    setReports,
    setLocalComments,
  } = useCommentContext();
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
      status: "APPROVED",
      postId,
      createdAt: new Date().toISOString(),
      children: [],
      likesCount: 0,
      isLiked: false,
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
      toast.warning("Please sign in to publish your narrative.");
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

      // On Success, save to local persistent list (awaiting moderation) so it doesn't vanish
      const approvedCommentCopy: EnhancedComment = {
        id: tempId, // keep tempId for matching
        parentId,
        content,
        username: currentUser || "Anonymous",
        nickname: currentUser || "Anonymous",
        avatar: "",
        status: "PENDING", // Visible awaiting moderation
        postId,
        createdAt: new Date().toISOString(),
        children: [],
        likesCount: 0,
        isLiked: false,
      };
      simulationStore.addLocalComment(postId, approvedCommentCopy);
      setLocalComments((prev) => [...prev, approvedCommentCopy]);

      // On Success, remove from pending list and fetch actual comments
      removePendingComment(tempId);
      await refetch();
      toast.success("Dialogue published! Awaiting community moderation.");
    } catch (err) {
      console.error("Comment submission failed, keeping in local failed list:", err);
      markPendingCommentFailed(tempId);
    }
  };

  // 2. RETRY (Retry a failed local comment)
  const retryPublishComment = async (tempId: number, content: string, parentId: number | null) => {
    await publishComment(content, parentId, tempId);
  };

  // 3. TOGGLE LIKE (Local Simulation + Real API Sync)
  const toggleLike = async (id: number, initialLikes: number = 0) => {
    const result = simulationStore.toggleLike(id, initialLikes);
    setLikes((prev) => ({ ...prev, [id]: result }));

    try {
      if (result.isLiked) {
        await likeCommentApi(id).unwrap();
        toast.success("Echo liked!");
      } else {
        await unlikeCommentApi(id).unwrap();
      }
    } catch (err) {
      console.error("Failed to sync comment like state:", err);
      // Rollback optimistic state if backend fails
      const rollbackResult = {
        isLiked: !result.isLiked,
        count: result.isLiked ? initialLikes : initialLikes + 1,
      };
      setLikes((prev) => ({ ...prev, [id]: rollbackResult }));
    }
  };

  // 4. EDIT COMMENT (Local Simulation + Real API Sync)
  const editComment = async (id: number, newContent: string) => {
    simulationStore.editComment(id, newContent);
    setEdits((prev) => ({ ...prev, [id]: newContent }));

    try {
      await editMyCommentApi({ id, content: newContent }).unwrap();
    } catch (err) {
      console.error("Failed to sync comment edit:", err);
    }
  };

  // 5. DELETE COMMENT (Local Simulation + Real API Sync)
  const deleteComment = async (id: number) => {
    simulationStore.deleteComment(id);
    setDeletions((prev) => [...prev, id]);
    setLocalComments((prev) => prev.filter((c) => c.id !== id));

    try {
      await deleteMyCommentApi(id).unwrap();
    } catch (err) {
      console.error("Failed to sync comment deletion:", err);
    }
  };

  // 6. REPORT COMMENT (Local Simulation + Real API Sync)
  const reportComment = async (id: number) => {
    simulationStore.reportComment(id);
    setReports((prev) => [...prev, id]);

    try {
      await reportCommentApi({ id, reason: "inappropriate" }).unwrap();
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
