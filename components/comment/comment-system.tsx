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
  isGuestbook?: boolean;
  onRequestClose?: () => void;
  children?: (parts: CommentSystemRenderParts) => React.ReactNode;
}

export interface CommentSystemRenderParts {
  totalCount: number;
  commentList: React.ReactNode;
  commentInput: React.ReactNode;
}

function CommentSystemContent({
  onRequestClose,
  children,
}: Pick<CommentSystemProps, "onRequestClose" | "children">) {
  const {
    comments,
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
    loadReplies,
    loadingReplyIds,
    hasMoreReplies,
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

  useCommentHighlight();

  const totalCount = backendTotal;
  const commentList = (
    <CommentList
      comments={comments}
      error={error}
      hasMore={hasMore}
      isFetching={isFetching}
      isLoading={isLoading}
      loadMore={loadMore}
      refetch={refetch}
      totalCount={totalCount}
      onDelete={deleteComment}
      onEditSave={editComment}
      onLikeToggle={toggleLike}
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
    return children({ totalCount, commentList, commentInput });
  }

  return (
    <section
      aria-label="Comments"
      className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col"
    >
      <div className="shrink-0 pb-4">
        <CommentHeader totalCount={totalCount} />
      </div>
      <ScrollShadow
        hideScrollBar
        className="min-h-0 flex-1 overflow-y-auto"
        orientation="vertical"
        size={32}
      >
        {commentList}
      </ScrollShadow>

      <div className="shrink-0 pt-4">{commentInput}</div>
    </section>
  );
}

export function CommentSystem({
  postId = 0,
  isGuestbook = false,
  onRequestClose,
  children,
}: CommentSystemProps) {
  return (
    <CommentProvider postId={postId} isGuestbook={isGuestbook}>
      <CommentSystemContent onRequestClose={onRequestClose}>{children}</CommentSystemContent>
    </CommentProvider>
  );
}
