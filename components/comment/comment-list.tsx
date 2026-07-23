"use client";

import React from "react";
import { Button, Card, Spinner, Typography, cn, ScrollShadow, Skeleton } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useCommentContext, SortOrder } from "./context/comment-context";
import { CommentItem } from "./comment-item";
import { EnhancedComment } from "./hooks/simulation-store";

interface CommentListProps {
  comments: EnhancedComment[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => Promise<unknown>;
  totalCount: number;
  onLikeToggle: (id: number, currentLikes: number) => void;
  onReplySubmit: (content: string, parentId: number) => Promise<void>;
  onEditSave: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  onReport: (id: number) => void;
  onRetry: (tempId: number, content: string, parentId: number | null) => Promise<void>;
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
  onReplySubmit,
  onEditSave,
  onDelete,
  onReport,
  onRetry,
}: CommentListProps) {
  const { sortOrder, setSortOrder, newCommentCount, setNewCommentCount } = useCommentContext();

  const handleSortChange = (newOrder: SortOrder) => {
    setSortOrder(newOrder);
  };

  const handleRefresh = async () => {
    setNewCommentCount(0);
    await refetch();
  };

  return (
    <>
      {newCommentCount > 0 && (
        <Button size="sm" variant="outline" onPress={handleRefresh} className="mx-auto">
          <Icon icon="lucide:arrow-up" />
          Load {newCommentCount} new perspective{newCommentCount > 1 ? "s" : ""}
        </Button>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} variant="secondary">
              <div className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-24 rounded-2xl" />
                  <Skeleton className="h-2.5 w-16 rounded-2xl" />
                </div>
              </div>
              <Skeleton className="mt-4 ml-11 h-4 w-5/6 rounded-2xl" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="flex flex-col items-center justify-center">
          <Icon icon="lucide:alert-circle" className="text-danger size-8" />
          <Typography type="body-sm" className="text-danger font-semibold">
            Unable to fetch dialog feed.
          </Typography>
          <Button size="sm" variant="outline" onPress={() => refetch()}>
            Retry Sync
          </Button>
        </Card>
      ) : comments.length === 0 ? (
        <EmptyState size="sm">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <Icon icon="lucide:messages-square" />
            </EmptyState.Media>
            <EmptyState.Title>Silent Frequency</EmptyState.Title>
            <EmptyState.Description className="max-w-xs text-center text-xs text-pretty">
              No signals received. Be the first to express a resonance and join the dialogue feed!
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <ScrollShadow variant="fade" hideScrollBar className="flex max-h-200 flex-col">
          <div className="flex w-full flex-col gap-2">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLikeToggle={onLikeToggle}
                onReplySubmit={onReplySubmit}
                onEditSave={onEditSave}
                onDelete={onDelete}
                onReport={onReport}
                onRetry={onRetry}
              />
            ))}
          </div>
          {hasMore && (
            <Button size="sm" variant="outline" className="mx-auto" onPress={loadMore}>
              <Icon icon="lucide:plus" />
              Explore More Dialogues
            </Button>
          )}
        </ScrollShadow>
      )}
    </>
  );
}
