"use client";

import { ScrollShadow } from "@heroui/react";
import type React from "react";
import { CommentInput } from "./comment-input";
import { CommentHeader } from "./comment-header";
import { CommentList } from "./comment-list";
import { CommentProvider } from "./context/comment-context";
import { useCommentHighlight } from "./hooks/use-comment-highlight";
import { useCommentMutations } from "./hooks/use-comment-mutations";
import { useComments } from "./hooks/use-comments";

interface CommentSystemProps {
  postId?: number;
  momentId?: number;
  isGuestbook?: boolean;
  onRequestClose?: () => void;
  children?: (parts: CommentSystemRenderParts) => React.ReactNode;
}

export interface CommentSystemRenderParts {
  totalCount: number;
  isInitialCountLoading: boolean;
  newCount: number;
  isLoadingNew: boolean;
  onLoadNew: () => void;
  commentList: React.ReactNode;
  commentInput: React.ReactNode;
}

function CommentSystemContent({
  onRequestClose,
  children,
}: Pick<CommentSystemProps, "onRequestClose" | "children">) {
  const {
    comments,
    totalCount,
    isInitialCountLoading,
    isLoading,
    isFetching,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
    addPendingComment,
    markPendingCommentSubmitted,
    markPendingCommentRetrying,
    markPendingCommentFailed,
    loadReplies,
    loadingReplyIds,
    hasMoreReplies,
    applyLikeOverride,
    revertLikeOverride,
    reconcileEditedComment,
    reconcileDeletedComment,
    hasComment,
    applyAnchorContext,
    newCount,
    isLoadingNew,
    loadNewComments,
  } = useComments();
  const {
    publishComment,
    retryPublishComment,
    toggleLike,
    pendingLikeIds,
    editComment,
    deleteComment,
    reportComment,
  } = useCommentMutations({
    addPendingComment,
    markPendingCommentSubmitted,
    markPendingCommentFailed,
    markPendingCommentRetrying,
    applyLikeOverride,
    revertLikeOverride,
    reconcileEditedComment,
    reconcileDeletedComment,
  });

  useCommentHighlight({
    hasComment,
    onAnchorContext: applyAnchorContext,
  });

  const commentList = (
    <CommentList
      comments={comments}
      error={error}
      hasMore={hasMore}
      isFetching={isFetching}
      isLoadingMore={isLoadingMore}
      isLoading={isLoading}
      loadMore={loadMore}
      refetch={refetch}
      totalCount={totalCount}
      onDelete={deleteComment}
      onEditSave={editComment}
      onLikeToggle={toggleLike}
      pendingLikeIds={pendingLikeIds}
      onAuthenticationRequired={onRequestClose}
      onReplySubmit={(content, parentId) => publishComment(content, parentId)}
      onReport={reportComment}
      onRetry={retryPublishComment}
      onLoadReplies={loadReplies}
      loadingReplyIds={loadingReplyIds}
      hasMoreReplies={hasMoreReplies}
    />
  );
  const commentInput = (
    <CommentInput
      onAuthenticationRequired={onRequestClose}
      onSubmit={(content) => publishComment(content, null)}
    />
  );

  if (children) {
    return children({
      totalCount,
      isInitialCountLoading,
      newCount,
      isLoadingNew,
      onLoadNew: loadNewComments,
      commentList,
      commentInput,
    });
  }

  return (
    <section
      aria-label="Comments"
      className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col"
    >
      <div className="shrink-0 pb-3">
        <CommentHeader
          isCountLoading={isInitialCountLoading}
          totalCount={totalCount}
          newCount={newCount}
          isLoadingNew={isLoadingNew}
          onLoadNew={loadNewComments}
        />
      </div>
      <ScrollShadow
        hideScrollBar
        className="min-h-0 flex-1 overflow-y-auto"
        orientation="vertical"
        size={24}
      >
        {commentList}
      </ScrollShadow>

      <div className="border-border/60 shrink-0 border-t pt-3">{commentInput}</div>
    </section>
  );
}

export function CommentSystem({
  postId = 0,
  momentId = 0,
  isGuestbook = false,
  onRequestClose,
  children,
}: CommentSystemProps) {
  return (
    <CommentProvider postId={postId} momentId={momentId} isGuestbook={isGuestbook}>
      <CommentSystemContent onRequestClose={onRequestClose}>{children}</CommentSystemContent>
    </CommentProvider>
  );
}
