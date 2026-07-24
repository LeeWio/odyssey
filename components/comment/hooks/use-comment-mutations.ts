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
} from "@/lib/features/comment/comment-api";
import { useCommentContext } from "../context/comment-context";
import { type EnhancedComment, simulationStore } from "./simulation-store";

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
    edits,
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

  // 3. TOGGLE LIKE (Memory-only Optimistic state + Real API Sync)
  const toggleLike = async (id: number, currentIsLiked: boolean, currentLikes: number) => {
    const nextLiked = !currentIsLiked;
    const nextCount = nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);

    // Set local optimistic state in memory
    setLikes((prev) => ({ ...prev, [id]: { count: nextCount, isLiked: nextLiked } }));

    try {
      if (nextLiked) {
        await likeCommentApi(id).unwrap();
        toast.success("Echo liked!");
      } else {
        await unlikeCommentApi(id).unwrap();
      }
    } catch (err) {
      console.error("Failed to sync comment like state:", err);
      // Rollback optimistic state if backend fails
      setLikes((prev) => ({ ...prev, [id]: { count: currentLikes, isLiked: currentIsLiked } }));
    }
  };

  // 4. EDIT COMMENT (Optimistic UI + Real API Sync)
  const editComment = async (id: number, newContent: string) => {
    const hadPreviousEdit = Object.hasOwn(edits, id);
    const previousEdit = edits[id];
    setEdits((prev) => ({ ...prev, [id]: newContent }));

    try {
      await editMyCommentApi({ id, content: newContent }).unwrap();
    } catch (err) {
      console.error("Failed to sync comment edit:", err);
      setEdits((prev) => {
        const next = { ...prev };
        if (hadPreviousEdit && previousEdit !== undefined) {
          next[id] = previousEdit;
        } else {
          delete next[id];
        }
        return next;
      });
    }
  };

  // 5. DELETE COMMENT (Optimistic UI + Real API Sync)
  const deleteComment = async (id: number) => {
    let removedLocalComment: EnhancedComment | undefined;
    setDeletions((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setLocalComments((prev) => {
      removedLocalComment = prev.find((c) => c.id === id);
      return prev.filter((c) => c.id !== id);
    });

    try {
      await deleteMyCommentApi(id).unwrap();
    } catch (err) {
      console.error("Failed to sync comment deletion:", err);
      setDeletions((prev) => prev.filter((deletedId) => deletedId !== id));
      if (removedLocalComment) {
        setLocalComments((prev) =>
          prev.some((c) => c.id === id) ? prev : [...prev, removedLocalComment as EnhancedComment]
        );
      }
    }
  };

  // 6. REPORT COMMENT (Optimistic UI + Real API Sync)
  const reportComment = async (id: number) => {
    setReports((prev) => (prev.includes(id) ? prev : [...prev, id]));

    try {
      await reportCommentApi({ id, reason: "inappropriate" }).unwrap();
    } catch (err) {
      console.error("Failed to sync comment report:", err);
      setReports((prev) => prev.filter((reportedId) => reportedId !== id));
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
