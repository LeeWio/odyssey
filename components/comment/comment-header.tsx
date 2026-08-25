"use client";

import { ChevronDown, Comments } from "@gravity-ui/icons";
import { Button, Chip, Dropdown, Label, Typography, type Key } from "@heroui/react";
import { Sheet } from "@heroui-pro/react";
import { memo, useEffect } from "react";
import { commentDebug } from "@/lib/comment-debug";
import { type SortOrder, useCommentSortContext } from "./context/comment-context";

interface CommentHeaderProps {
  totalCount: number;
  inSheet?: boolean;
}

const SORT_LABELS: Record<SortOrder, string> = {
  newest: "Recent",
  oldest: "Oldest",
  likes: "Top",
};

function isSortOrder(value: Key | undefined): value is SortOrder {
  return value === "newest" || value === "oldest" || value === "likes";
}

export const CommentHeader = memo(function CommentHeader({
  totalCount,
  inSheet = false,
}: CommentHeaderProps) {
  const { sortOrder, setSortOrder } = useCommentSortContext();

  useEffect(() => {
    commentDebug("header:render", { totalCount, inSheet, sortOrder });
  });

  useEffect(() => {
    commentDebug("header:mounted", { inSheet });
    return () => commentDebug("header:unmounted", { inSheet });
  }, [inSheet]);

  const heading = (
    <>
      <Comments aria-hidden="true" />
      Comments
      <Chip size="sm" variant="soft" color="accent" className="tabular-nums">
        {totalCount}
      </Chip>
    </>
  );

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      {inSheet ? (
        <Sheet.Heading className="flex items-center gap-2">{heading}</Sheet.Heading>
      ) : (
        <Typography type="h4" weight="semibold" className="flex items-center gap-2">
          {heading}
        </Typography>
      )}

      <div className="flex items-center gap-2">
        <Dropdown>
          <Button
            isDisabled={totalCount <= 1}
            size="sm"
            variant="tertiary"
            aria-label="Choose comment sort"
          >
            {SORT_LABELS[sortOrder]}
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
      </div>
    </div>
  );
});
