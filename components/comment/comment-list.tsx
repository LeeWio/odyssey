"use client";

import { ArrowUp, ArrowUpArrowDown, ChevronDown, Comments } from "@gravity-ui/icons";
import { Alert, Button, Dropdown, Separator, Skeleton } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { Fragment } from "react";
import { CommentItem } from "./comment-item";
import { type SortOrder, useCommentContext } from "./context/comment-context";
import type { EnhancedComment } from "./hooks/simulation-store";

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

const SORT_LABELS: Record<SortOrder, string> = {
  newest: "Newest",
  oldest: "Oldest",
  likes: "Most liked",
};

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
  const { newCommentCount, setNewCommentCount, sortOrder, setSortOrder } = useCommentContext();

  const handleRefresh = async () => {
    setNewCommentCount(0);
    await refetch();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <p className="text-muted text-sm">
          {totalCount} {totalCount === 1 ? "comment" : "comments"}
          {isFetching && !isLoading && <span className="sr-only">, updating</span>}
        </p>

        <Dropdown>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Sort comments by ${SORT_LABELS[sortOrder]}`}
          >
            <ArrowUpArrowDown />
            {SORT_LABELS[sortOrder]}
            <ChevronDown />
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu onAction={(key) => setSortOrder(key as SortOrder)}>
              <Dropdown.Item id="newest" textValue="Newest">
                Newest
              </Dropdown.Item>
              <Dropdown.Item id="oldest" textValue="Oldest">
                Oldest
              </Dropdown.Item>
              <Dropdown.Item id="likes" textValue="Most liked">
                Most liked
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
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
        <div className="flex flex-col">
          {comments.map((comment, index) => (
            <Fragment key={comment.id}>
              {index > 0 && <Separator variant="tertiary" className="my-5" />}
              <CommentItem
                comment={comment}
                onDelete={onDelete}
                onEditSave={onEditSave}
                onLikeToggle={onLikeToggle}
                onReplySubmit={onReplySubmit}
                onReport={onReport}
                onRetry={onRetry}
              />
            </Fragment>
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
