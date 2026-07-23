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
    <div className="flex flex-col gap-6">
      {/* 1. Header controls (Total count, sync spinners, sorting selector) */}
      <div className="border-default-100/50 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <Icon icon="lucide:message-square" className="text-accent size-5" />
          <Typography type="h3" className="text-lg font-bold tracking-tight">
            Dialogue Feed
          </Typography>
          <span className="bg-default-100 text-default-600 rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold">
            {totalCount}
          </span>

          {isFetching && !isLoading && (
            <div className="flex items-center gap-1.5 opacity-60">
              <Spinner size="sm" color="accent" />
              <span className="text-default-400 text-[10px] font-semibold">Syncing...</span>
            </div>
          )}
        </div>

        {/* Sorting controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 rounded-full border border-transparent px-3 text-[11px] font-semibold",
              sortOrder === "newest" ? "bg-default-100 text-foreground" : "text-default-400"
            )}
            onPress={() => handleSortChange("newest")}
          >
            Newest
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 rounded-full border border-transparent px-3 text-[11px] font-semibold",
              sortOrder === "oldest" ? "bg-default-100 text-foreground" : "text-default-400"
            )}
            onPress={() => handleSortChange("oldest")}
          >
            Oldest
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 rounded-full border border-transparent px-3 text-[11px] font-semibold",
              sortOrder === "likes" ? "bg-default-100 text-foreground" : "text-default-400"
            )}
            onPress={() => handleSortChange("likes")}
          >
            Most Liked
          </Button>
        </div>
      </div>

      {/* 2. Floating notification pill if background comments arrived */}
      {newCommentCount > 0 && (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="ghost"
            className="bg-accent/10 border-accent/20 text-accent animate-bounce rounded-full border px-4 text-xs font-semibold"
            onPress={handleRefresh}
          >
            <Icon icon="lucide:arrow-up" className="mr-1.5 size-3.5" />
            Load {newCommentCount} new perspective{newCommentCount > 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {/* 3. Comment feed rendering */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card
              key={idx}
              variant="secondary"
              className="bg-default-50/20 border-border/30 relative h-32 rounded-2xl border p-4 shadow-none"
            >
              <div className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-2.5 w-16 rounded" />
                </div>
              </div>
              <Skeleton className="mt-4 ml-11 h-4 w-5/6 rounded" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-danger/20 bg-danger-soft/10 flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 text-center shadow-none">
          <Icon icon="lucide:alert-circle" className="text-danger size-8" />
          <Typography type="body-sm" className="text-danger mt-3 font-semibold">
            Unable to fetch dialog feed.
          </Typography>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => refetch()}
            className="mt-4 rounded-full font-semibold transition-all duration-150 ease-out active:scale-[0.96]"
          >
            Retry Sync
          </Button>
        </Card>
      ) : comments.length === 0 ? (
        <div className="border-border/30 flex items-center justify-center rounded-3xl border border-dashed px-6 py-12">
          <EmptyState size="sm">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Icon icon="lucide:messages-square" className="text-default-400 size-6" />
              </EmptyState.Media>
              <EmptyState.Title>Silent Frequency</EmptyState.Title>
              <EmptyState.Description className="max-w-xs text-center text-xs text-pretty">
                No signals received. Be the first to express a resonance and join the dialogue feed!
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <ScrollShadow hideScrollBar className="flex max-h-[800px] flex-col gap-6 p-1">
            <div className="flex w-full flex-col gap-6">
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
          </ScrollShadow>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button size="sm" variant="outline" onPress={loadMore}>
                <Icon icon="lucide:plus" className="text-default-500 mr-1.5 size-3.5" />
                Explore More Dialogues
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
