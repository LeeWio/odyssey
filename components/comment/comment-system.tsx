"use client";

import React from "react";
import { CommentProvider } from "./context/comment-context";
import { CommentInput } from "./comment-input";
import { CommentList } from "./comment-list";
import { useComments } from "./hooks/use-comments";
import { useCommentMutations } from "./hooks/use-comment-mutations";
import { useCommentHighlight } from "./hooks/use-comment-highlight";

interface CommentSystemProps {
  postId?: number;
  isGuestbook?: boolean;
}

// Inner container that can safely utilize comment context
function CommentSystemContainer() {
  const {
    comments,
    allCommentsCount,
    backendTotal,
    isLoading,
    isFetching,
    error,
    hasMore,
    loadMore,
    refetch,
    addPendingComment,
    removePendingComment,
    markPendingCommentFailed,
  } = useComments();

  const {
    publishComment,
    retryPublishComment,
    toggleLike,
    editComment,
    deleteComment,
    reportComment,
  } = useCommentMutations({
    addPendingComment,
    removePendingComment,
    markPendingCommentFailed,
    refetch,
  });

  // Activate highlight and anchoring listener
  useCommentHighlight();

  const handleRootSubmit = async (content: string) => {
    await publishComment(content, null);
  };

  const handleReplySubmit = async (content: string, parentId: number) => {
    await publishComment(content, parentId);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <CommentInput onSubmit={handleRootSubmit} />
      <CommentList
        comments={comments}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        hasMore={hasMore}
        loadMore={loadMore}
        refetch={refetch}
        totalCount={backendTotal || allCommentsCount}
        onLikeToggle={toggleLike}
        onReplySubmit={handleReplySubmit}
        onEditSave={editComment}
        onDelete={deleteComment}
        onReport={reportComment}
        onRetry={retryPublishComment}
      />
    </div>
  );
}

// Main exported orchestrator with provider boundary
export function CommentSystem({ postId = 0, isGuestbook = false }: CommentSystemProps) {
  return (
    <CommentProvider postId={postId} isGuestbook={isGuestbook}>
      <CommentSystemContainer />
    </CommentProvider>
  );
}
