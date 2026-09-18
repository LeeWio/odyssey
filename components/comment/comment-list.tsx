"use client";

import { Icon } from "@iconify/react";

import { Alert, Button, Skeleton } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { CommentItem } from "./comment-item";
import { useCommentContext } from "./context/comment-context";
import type { EnhancedComment } from "./types";

interface CommentListProps {
  comments: EnhancedComment[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => Promise<unknown>;
  totalCount: number;
  onLikeToggle: (id: number, isLiked: boolean, likesCount: number) => void;
  onAuthenticationRequired?: () => void;
  onReplySubmit: (content: string, parentId: number) => Promise<boolean>;
  onEditSave: (id: number, content: string) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onReport: (id: number, reason: string) => Promise<boolean>;
  onRetry: (tempId: number, content: string, parentId: number | null) => Promise<boolean>;
  onLoadReplies: (parentId: number) => Promise<void>;
  loadingReplyIds: Set<number>;
  hasMoreReplies: (parentId: number) => boolean;
}

export function CommentList({
  comments,
  isLoading,
  isFetching,
  error,
  hasMore,
  loadMore,
  refetch,
  totalCount,
  onLikeToggle,
  onAuthenticationRequired,
  onReplySubmit,
  onEditSave,
  onDelete,
  onReport,
  onRetry,
  onLoadReplies,
  loadingReplyIds,
  hasMoreReplies,
}: CommentListProps) {
  const { isGuestbook, isMoment } = useCommentContext();
  const emptyTitle = isGuestbook ? "No entries yet" : "No comments yet";
  const emptyDescription = isGuestbook
    ? "Leave the first note in the guestbook."
    : isMoment
      ? "Be the first to reply to this moment."
      : "Be the first to start the discussion.";
  const unit = isGuestbook
    ? totalCount === 1
      ? "entry"
      : "entries"
    : totalCount === 1
      ? "comment"
      : "comments";

  return (
    <div className="flex flex-col">
      <p className="sr-only" aria-live="polite">
        {totalCount} {unit}
        {isFetching && !isLoading ? ", updating" : ""}
      </p>

      {isLoading ? (
        <div className="divide-border/70 flex flex-col divide-y" aria-label="Loading comments">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-3 py-5">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2.5 pt-0.5">
                <Skeleton className="h-3 w-28 rounded-md" />
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-4/5 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Alert status="danger" className="my-4">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Couldn’t load comments</Alert.Title>
            <Alert.Description>Check your connection and try again.</Alert.Description>
          </Alert.Content>
          <Button size="sm" variant="outline" onPress={() => refetch()}>
            Retry
          </Button>
        </Alert>
      ) : comments.length === 0 ? (
        <EmptyState size="sm" className="py-10">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <Icon icon="gravity-ui:comments" />
            </EmptyState.Media>
            <EmptyState.Title>{emptyTitle}</EmptyState.Title>
            <EmptyState.Description>{emptyDescription}</EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <div className="flex flex-col">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={onDelete}
              onEditSave={onEditSave}
              onLikeToggle={onLikeToggle}
              onAuthenticationRequired={onAuthenticationRequired}
              onReplySubmit={onReplySubmit}
              onReport={onReport}
              onRetry={onRetry}
              onLoadReplies={onLoadReplies}
              loadingReplyIds={loadingReplyIds}
              hasMoreReplies={hasMoreReplies}
            />
          ))}

          {hasMore ? (
            <div className="flex justify-center py-4">
              <Button
                size="sm"
                variant="ghost"
                className="text-muted hover:text-foreground h-8 text-xs"
                isPending={isFetching}
                onPress={loadMore}
              >
                Load more
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
