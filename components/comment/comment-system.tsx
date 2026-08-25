"use client";

import { ScrollShadow } from "@heroui/react";
import { useEffect } from "react";
import { CommentInput } from "./comment-input";
import { CommentList } from "./comment-list";
import { CommentProvider } from "./context/comment-context";
import { useCommentHighlight } from "./hooks/use-comment-highlight";
import { useCommentMutations } from "./hooks/use-comment-mutations";
import { useComments } from "./hooks/use-comments";

interface CommentSystemProps {
  postId?: number;
  isGuestbook?: boolean;
  onRequestClose?: () => void;
  onCountChange?: (count: number) => void;
}

function CommentSystemContent({
  onRequestClose,
  onCountChange,
}: {
  onRequestClose?: () => void;
  onCountChange?: (count: number) => void;
}) {
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

  useEffect(() => {
    onCountChange?.(backendTotal || allCommentsCount);
  }, [allCommentsCount, backendTotal, onCountChange]);

  return (
    <section aria-label="Comments" className="flex min-h-0 flex-1 flex-col">
      <ScrollShadow
        hideScrollBar
        className="min-h-0 flex-1 overflow-y-auto"
        orientation="vertical"
        size={32}
      >
        <CommentList
          comments={comments}
          error={error}
          hasMore={hasMore}
          isFetching={isFetching}
          isLoading={isLoading}
          loadMore={loadMore}
          refetch={refetch}
          totalCount={backendTotal || allCommentsCount}
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
      </ScrollShadow>

      <div className="shrink-0 pt-4">
        <CommentInput
          onAuthenticationRequired={onRequestClose}
          onSubmit={(content) => publishComment(content, null)}
        />
      </div>
    </section>
  );
}

export function CommentSystem({
  postId = 0,
  isGuestbook = false,
  onRequestClose,
  onCountChange,
}: CommentSystemProps) {
  return (
    <CommentProvider postId={postId} isGuestbook={isGuestbook}>
      <CommentSystemContent onCountChange={onCountChange} onRequestClose={onRequestClose} />
    </CommentProvider>
  );
}
