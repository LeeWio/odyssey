"use client";

import { Icon } from "@iconify/react";

import { Button, Dropdown, Label, Typography, type Key } from "@heroui/react";
import { Sheet } from "@heroui-pro/react";
import { memo } from "react";
import {
  type SortOrder,
  useCommentContext,
  useCommentSortContext,
} from "./context/comment-context";

interface CommentHeaderProps {
  totalCount: number;
  isCountLoading?: boolean;
  inSheet?: boolean;
  newCount?: number;
  isLoadingNew?: boolean;
  onLoadNew?: () => void;
}

const SORT_LABELS: Record<SortOrder, string> = {
  newest: "Newest",
  oldest: "Oldest",
  likes: "Top",
};

function isSortOrder(value: Key | undefined): value is SortOrder {
  return value === "newest" || value === "oldest" || value === "likes";
}

function threadTitle(isGuestbook: boolean, isMoment: boolean) {
  if (isGuestbook) return "Guestbook";
  if (isMoment) return "Comments";
  return "Comments";
}

function newCommentsLabel(count: number, isGuestbook: boolean) {
  if (isGuestbook) {
    return count === 1 ? "1 new entry" : `${count} new entries`;
  }
  return count === 1 ? "1 new comment" : `${count} new comments`;
}

export const CommentHeader = memo(function CommentHeader({
  totalCount,
  isCountLoading = false,
  inSheet = false,
  newCount = 0,
  isLoadingNew = false,
  onLoadNew,
}: CommentHeaderProps) {
  const { sortOrder, setSortOrder } = useCommentSortContext();
  const { isGuestbook, isMoment } = useCommentContext();
  const title = threadTitle(isGuestbook, isMoment);

  const heading = (
    <span className="inline-flex items-baseline gap-2">
      <span>{title}</span>
      <span
        aria-hidden={isCountLoading || undefined}
        className={
          isCountLoading
            ? "text-muted invisible text-sm font-normal tabular-nums"
            : "text-muted text-sm font-normal tabular-nums"
        }
      >
        {isCountLoading ? 0 : totalCount}
      </span>
    </span>
  );

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        {inSheet ? (
          <Sheet.Heading>{heading}</Sheet.Heading>
        ) : (
          <Typography type="h4" weight="semibold">
            {heading}
          </Typography>
        )}

        <Dropdown>
          <Dropdown.Trigger>
            <Button
              isDisabled={totalCount <= 1}
              size="sm"
              variant="ghost"
              className="text-muted hover:text-foreground h-8 gap-1 px-2 text-xs"
              aria-label="Choose comment sort"
            >
              {SORT_LABELS[sortOrder]}
              <Icon icon="gravity-ui:chevron-down" aria-hidden="true" className="size-3.5" />
            </Button>
          </Dropdown.Trigger>
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
      </div>

      {newCount > 0 ? (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 rounded-full px-3 text-xs shadow-sm"
            isPending={isLoadingNew}
            aria-live="polite"
            onPress={onLoadNew}
          >
            <Icon icon="gravity-ui:arrow-up" aria-hidden="true" className="size-3.5" />
            {newCommentsLabel(newCount, isGuestbook)}
          </Button>
        </div>
      ) : null}
    </div>
  );
});
