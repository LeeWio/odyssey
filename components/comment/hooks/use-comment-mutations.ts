"use client";

import { toast } from "@heroui/react";
import { useRef } from "react";
import {
  commentApi,
  publishedCommentTags,
  publishedGuestbookCommentTags,
  publishedMomentCommentTags,
  relatedContentCountTags,
  type CommentLikePatch,
  type CommentPublishResponse,
  useDeleteMyCommentMutation,
  useEditMyCommentMutation,
  useLikeCommentMutation,
  usePostGuestbookEntryMutation,
  usePublishCommentMutation,
  usePublishMomentCommentMutation,
  useReportCommentMutation,
  useUnlikeCommentMutation,
} from "@/lib/features/comment";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch } from "@/lib/hooks";
import { useCommentContext } from "../context/comment-context";
import type { EnhancedComment } from "../types";
import { commentDebug } from "@/lib/comment-debug";

interface MutationHookProps {
  addPendingComment: (c: EnhancedComment) => void;
  markPendingCommentSubmitted: (id: number, submission: CommentPublishResponse | null) => void;
  markPendingCommentFailed: (id: number) => void;
  markPendingCommentRetrying: (id: number) => void;
  applyLikeOverride: (
    id: number,
    currentLiked: boolean,
    currentCount: number,
    liked: boolean
  ) => CommentLikePatch;
  revertLikeOverride: (id: number, snapshot: CommentLikePatch) => void;
  patchReply: (commentId: number, content: string) => void;
  removeReply: (commentId: number) => void;
}

export function useCommentMutations({
  addPendingComment,
  markPendingCommentSubmitted,
  markPendingCommentFailed,
  markPendingCommentRetrying,
  applyLikeOverride,
  revertLikeOverride,
  patchReply,
  removeReply,
}: MutationHookProps) {
  const dispatch = useAppDispatch();
  const { isGuestbook, isMoment, postId, momentId, currentUser, currentUserId, isAuthenticated } =
    useCommentContext();
  const [publishCommentApi] = usePublishCommentMutation();
  const [publishMomentCommentApi] = usePublishMomentCommentMutation();
  const [postGuestbookEntryApi] = usePostGuestbookEntryMutation();
  const [editMyCommentApi] = useEditMyCommentMutation();
  const [deleteMyCommentApi] = useDeleteMyCommentMutation();
  const [likeCommentApi] = useLikeCommentMutation();
  const [unlikeCommentApi] = useUnlikeCommentMutation();
  const [reportCommentApi] = useReportCommentMutation();
  const idempotencyKeys = useRef(new Map<number, string>());
  const tempIdSequence = useRef(0);

  const invalidateAfterReconciliation = (parentId: number | null) => {
    const invalidate = () => {
      const tags = isGuestbook
        ? publishedGuestbookCommentTags
        : isMoment
          ? publishedMomentCommentTags(momentId, parentId ?? undefined)
          : [
              ...publishedCommentTags(postId, parentId ?? undefined),
              ...relatedContentCountTags(postId),
            ];
      dispatch(commentApi.util.invalidateTags(tags));
    };

    if (typeof requestAnimationFrame === "undefined") {
      queueMicrotask(invalidate);
      return;
    }
    requestAnimationFrame(invalidate);
  };

  const createIdempotencyKey = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const createOptimisticComment = (
    tempId: number,
    content: string,
    parentId: number | null
  ): EnhancedComment => {
    return {
      id: tempId,
      parentId,
      content,
      authorUserId: currentUserId,
      username: currentUser || "Anonymous",
      nickname: currentUser || "Anonymous",
      avatar: "",
      status: "PENDING",
      postId: isMoment ? null : postId,
      momentId: isMoment ? momentId : null,
      createdAt: new Date().toISOString(),
      children: [],
      likesCount: 0,
      reportsCount: 0,
      replyCount: 0,
      likedByCurrentUser: false,
      viewerCanEdit: true,
      viewerCanDelete: true,
      pinned: false,
      featured: false,
      deletedPlaceholder: false,
      editedAt: null,
      isPending: true,
    };
  };

  const publishComment = async (
    content: string,
    parentId: number | null = null,
    existingTempId?: number
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.warning("Please sign in to post a comment.");
      return false;
    }

    if (!isGuestbook && !isMoment && postId <= 0) {
      toast.danger("This comment thread is unavailable.");
      return false;
    }
    if (isMoment && momentId <= 0) {
      toast.danger("This moment comment thread is unavailable.");
      return false;
    }

    const tempId = existingTempId ?? -(Date.now() * 1000 + (tempIdSequence.current++ % 1000));
    const idempotencyKey = idempotencyKeys.current.get(tempId) ?? createIdempotencyKey();
    idempotencyKeys.current.set(tempId, idempotencyKey);
    commentDebug("mutation:publish-start", {
      postId,
      momentId,
      parentId,
      tempId,
      isGuestbook,
      isMoment,
    });

    if (existingTempId) {
      markPendingCommentRetrying(tempId);
    } else {
      addPendingComment(createOptimisticComment(tempId, content, parentId));
    }

    try {
      if (isGuestbook) {
        const submission = await postGuestbookEntryApi({
          content,
          parentId: parentId || undefined,
          idempotencyKey,
          deferInvalidation: true,
        }).unwrap();
        markPendingCommentSubmitted(tempId, submission);
      } else if (isMoment) {
        const submission = await publishMomentCommentApi({
          content,
          momentId,
          parentId: parentId || undefined,
          idempotencyKey,
          deferInvalidation: true,
        }).unwrap();
        markPendingCommentSubmitted(tempId, submission);
      } else {
        const submission = await publishCommentApi({
          content,
          postId,
          parentId: parentId || undefined,
          idempotencyKey,
          deferInvalidation: true,
        }).unwrap();
        markPendingCommentSubmitted(tempId, submission);
      }

      invalidateAfterReconciliation(parentId);
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

  const retryPublishComment = async (
    tempId: number,
    content: string,
    parentId: number | null
  ): Promise<boolean> => {
    return publishComment(content, parentId, tempId);
  };

  const toggleLike = async (id: number, currentIsLiked: boolean, currentLikesCount = 0) => {
    if (!isAuthenticated) {
      toast.warning("Please sign in to react to comments.");
      dispatch(setLoginOpen(true));
      return;
    }

    const nextLiked = !currentIsLiked;
    const previous: CommentLikePatch = {
      likedByCurrentUser: currentIsLiked,
      likesCount: Math.max(0, currentLikesCount),
    };
    applyLikeOverride(id, currentIsLiked, currentLikesCount, nextLiked);

    try {
      const snapshot = nextLiked
        ? await likeCommentApi(id).unwrap()
        : await unlikeCommentApi(id).unwrap();
      revertLikeOverride(id, {
        likedByCurrentUser: snapshot.liked,
        likesCount: snapshot.likesCount,
      });
    } catch (err) {
      revertLikeOverride(id, previous);
      console.error("Failed to sync comment like state:", err);
      toast.danger("Couldn't update comment reaction.");
    }
  };

  const editComment = async (id: number, newContent: string) => {
    try {
      await editMyCommentApi({ id, content: newContent }).unwrap();
      patchReply(id, newContent);
      return true;
    } catch (err) {
      console.error("Failed to sync comment edit:", err);
      toast.danger("Couldn't update the comment.");
      return false;
    }
  };

  const deleteComment = async (id: number) => {
    try {
      await deleteMyCommentApi(id).unwrap();
      removeReply(id);
      const tags = isGuestbook
        ? publishedGuestbookCommentTags
        : isMoment
          ? publishedMomentCommentTags(momentId)
          : [...publishedCommentTags(postId), ...relatedContentCountTags(postId)];
      dispatch(commentApi.util.invalidateTags(tags));
      return true;
    } catch (err) {
      console.error("Failed to sync comment deletion:", err);
      toast.danger("Couldn't delete the comment.");
      return false;
    }
  };

  const reportComment = async (id: number, reason: string) => {
    if (!isAuthenticated) {
      toast.warning("Please sign in to report a comment.");
      dispatch(setLoginOpen(true));
      return false;
    }

    try {
      await reportCommentApi({ id, reason }).unwrap();
      toast.success("Report submitted.");
      return true;
    } catch (err) {
      console.error("Failed to sync comment report:", err);
      toast.danger("Couldn't submit the report.");
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
