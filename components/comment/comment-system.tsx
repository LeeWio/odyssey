"use client";

import { Surface } from "@heroui/react";
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
}

function CommentSystemContent({ onRequestClose }: { onRequestClose?: () => void }) {
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

  useCommentHighlight();

  return (
    <section aria-label="Comments" className="w-full">
      <Surface className="flex flex-col gap-5" variant="transparent">
        <CommentInput
          onAuthenticationRequired={onRequestClose}
          onSubmit={(content) => publishComment(content, null)}
        />

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
        />
      </Surface>
    </section>
  );
}

export function CommentSystem({
  postId = 0,
  isGuestbook = false,
  onRequestClose,
}: CommentSystemProps) {
  return (
    <CommentProvider postId={postId} isGuestbook={isGuestbook}>
      <CommentSystemContent onRequestClose={onRequestClose} />
    </CommentProvider>
  );
}
