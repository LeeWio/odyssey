"use client";

import { Comments } from "@gravity-ui/icons";
import { Alert, Button, Skeleton } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { CommentItem } from "./comment-item";
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
  onLikeToggle: (id: number, isLiked: boolean) => void;
  onAuthenticationRequired?: () => void;
  onReplySubmit: (content: string, parentId: number) => Promise<void>;
  onEditSave: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  onReport: (id: number) => void;
  onRetry: (tempId: number, content: string, parentId: number | null) => Promise<void>;
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
  return (
    <div className="flex flex-col gap-5">
      <p className="sr-only" aria-live="polite">
        {totalCount} {totalCount === 1 ? "comment" : "comments"}
        {isFetching && !isLoading ? ", updating" : ""}
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-6" aria-label="Loading comments">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-3 py-5 first:pt-1">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-3 pt-1">
                <Skeleton className="h-3.5 w-36 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Comments could not be loaded</Alert.Title>
            <Alert.Description>Check your connection and try again.</Alert.Description>
          </Alert.Content>
          <Button size="sm" variant="outline" onPress={() => refetch()}>
            Retry
          </Button>
        </Alert>
      ) : comments.length === 0 ? (
        <EmptyState size="sm" className="py-12">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <Comments />
            </EmptyState.Media>
            <EmptyState.Title>No comments yet</EmptyState.Title>
            <EmptyState.Description>
              Start the discussion with a thoughtful response.
            </EmptyState.Description>
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

          {hasMore && (
            <Button size="sm" variant="secondary" className="mt-6 self-center" onPress={loadMore}>
              Load more comments
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
