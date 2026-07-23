"use client";

import React from "react";
import { Alert, Button, Card, Typography, ScrollShadow, Skeleton } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useCommentContext } from "./context/comment-context";
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
  onLikeToggle: (id: number, isLiked: boolean, currentLikes: number) => void;
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
  const { newCommentCount, setNewCommentCount } = useCommentContext();

  const handleRefresh = async () => {
    setNewCommentCount(0);
    await refetch();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Typography type="body-sm" color="muted">
          {totalCount} {totalCount === 1 ? "response" : "responses"}
          {isFetching && !isLoading ? " · Syncing" : ""}
        </Typography>
      </div>

      {newCommentCount > 0 && (
        <div className="flex justify-center">
          <Button size="sm" variant="outline" onPress={handleRefresh}>
            <Icon icon="lucide:arrow-up" />
            Load {newCommentCount} new perspective{newCommentCount > 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} variant="secondary">
              <div className="flex gap-3">
                <div className="size-8 shrink-0 rounded-full">
                  <Skeleton />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-3.5 w-24 rounded-2xl">
                    <Skeleton />
                  </div>
                  <div className="h-2.5 w-16 rounded-2xl">
                    <Skeleton />
                  </div>
                </div>
              </div>
              <div className="mt-4 ml-11 h-4 w-5/6 rounded-2xl">
                <Skeleton />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Unable to fetch dialog feed.</Alert.Title>
          </Alert.Content>
          <Button size="sm" variant="outline" onPress={() => refetch()}>
            Retry Sync
          </Button>
        </Alert>
      ) : comments.length === 0 ? (
        <EmptyState size="sm">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <Icon icon="lucide:messages-square" />
            </EmptyState.Media>
            <EmptyState.Title>Silent Frequency</EmptyState.Title>
            <EmptyState.Description>
              No signals received. Be the first to express a resonance and join the dialogue feed!
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <div className="flex max-h-200 flex-col">
          <ScrollShadow variant="fade" hideScrollBar>
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
              <div className="flex justify-center">
                <Button size="sm" variant="outline" onPress={loadMore}>
                  <Icon icon="lucide:plus" />
                  Explore More Dialogues
                </Button>
              </div>
            )}
          </ScrollShadow>
        </div>
      )}
    </>
  );
}
