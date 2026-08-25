"use client";

import { ArrowRotateRight, ArrowUp, ChevronDown, Comments } from "@gravity-ui/icons";
import {
  Alert,
  Button,
  ButtonGroup,
  Chip,
  Dropdown,
  Label,
  Skeleton,
  Tooltip,
  Typography,
  type Key,
} from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { CommentItem } from "./comment-item";
import { type SortOrder, useCommentContext } from "./context/comment-context";
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

const SORT_LABELS: Record<SortOrder, string> = {
  newest: "Recent",
  oldest: "Oldest",
  likes: "Top",
};

function isSortOrder(value: Key | undefined): value is SortOrder {
  return value === "newest" || value === "oldest" || value === "likes";
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
  const { newCommentCount, setNewCommentCount, sortOrder, setSortOrder } = useCommentContext();

  const handleRefresh = async () => {
    setNewCommentCount(0);
    await refetch();
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="sr-only" aria-live="polite">
        {totalCount} {totalCount === 1 ? "comment" : "comments"}
        {isFetching && !isLoading ? ", updating" : ""}
      </p>

      <div className="border-default-200/70 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Typography className="text-foreground text-lg font-semibold tracking-tight">
              Discussion
            </Typography>
            <Chip size="sm" variant="soft" color="accent" className="tabular-nums">
              {totalCount}
            </Chip>
          </div>
          <p className="text-muted mt-1 text-sm">
            {totalCount === 0
              ? "Be the first to share a perspective."
              : "Thoughts from the community."}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          {isFetching && !isLoading && (
            <span className="text-muted text-xs" aria-live="polite">
              Updating…
            </span>
          )}
          {totalCount > 1 && (
            <ButtonGroup aria-label="Sort comments" size="sm" variant="tertiary">
              <Button>{SORT_LABELS[sortOrder]}</Button>
              <Dropdown>
                <Button isIconOnly aria-label="Choose comment sort">
                  <ChevronDown aria-hidden="true" />
                </Button>
                <Dropdown.Popover placement="bottom end">
                  <Dropdown.Menu
                    selectedKeys={new Set<Key>([sortOrder])}
                    selectionMode="single"
                    onAction={(key) => {
                      if (isSortOrder(key)) setSortOrder(key);
                    }}
                  >
                    {(Object.entries(SORT_LABELS) as [SortOrder, string][]).map(([key, label]) => (
                      <Dropdown.Item key={key} id={key} textValue={label}>
                        <Label>{label}</Label>
                        <Dropdown.ItemIndicator />
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </ButtonGroup>
          )}
          <Tooltip delay={0} closeDelay={100}>
            <Tooltip.Trigger aria-label="Refresh comments">
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                aria-label="Refresh comments"
                isPending={isFetching}
                onPress={handleRefresh}
              >
                <ArrowRotateRight aria-hidden="true" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>Refresh comments</Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {newCommentCount > 0 && (
        <Button size="sm" variant="secondary" className="self-center" onPress={handleRefresh}>
          <ArrowUp />
          Show {newCommentCount} new {newCommentCount === 1 ? "comment" : "comments"}
        </Button>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-6" aria-label="Loading comments">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-default-200/60 flex gap-3 border-b py-5 first:pt-1">
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
        <EmptyState size="sm" className="border-default-200/70 border-y py-12">
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
