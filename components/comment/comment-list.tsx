"use client";

import { ArrowUp, ChevronDown, Comments } from "@gravity-ui/icons";
import { Alert, Button, ButtonGroup, Dropdown, Label, Skeleton, type Key } from "@heroui/react";
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
    <div className="flex flex-col gap-4">
      <p className="sr-only" aria-live="polite">
        {totalCount} {totalCount === 1 ? "comment" : "comments"}
        {isFetching && !isLoading ? ", updating" : ""}
      </p>

      <div className="flex items-center justify-end gap-2 px-1">
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
      </div>

      {newCommentCount > 0 && (
        <Button size="sm" variant="outline" className="self-center" onPress={handleRefresh}>
          <ArrowUp />
          Show {newCommentCount} new {newCommentCount === 1 ? "comment" : "comments"}
        </Button>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-6" aria-label="Loading comments">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-2/3 rounded-md" />
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
        <EmptyState size="sm" className="py-8">
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
        <div className="divide-border/40 flex flex-col divide-y">
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
            <Button size="sm" variant="outline" className="mt-6 self-center" onPress={loadMore}>
              Load more comments
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
