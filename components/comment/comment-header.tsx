"use client";

import { Icon } from "@iconify/react";

import { Button, Dropdown, Label, Typography, type Key } from "@heroui/react";
import { Sheet } from "@heroui-pro/react";
import { useTranslations } from "next-intl";
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

const SORT_ORDERS: SortOrder[] = ["newest", "oldest", "likes"];

function isSortOrder(value: Key | undefined): value is SortOrder {
  return value === "newest" || value === "oldest" || value === "likes";
}

export const CommentHeader = memo(function CommentHeader({
  totalCount,
  isCountLoading = false,
  inSheet = false,
  newCount = 0,
  isLoadingNew = false,
  onLoadNew,
}: CommentHeaderProps) {
  const t = useTranslations("Comments");
  const { sortOrder, setSortOrder } = useCommentSortContext();
  const { isGuestbook } = useCommentContext();
  const title = isGuestbook ? t("guestbook") : t("section");
  const sortLabels: Record<SortOrder, string> = {
    newest: t("newest"),
    oldest: t("oldest"),
    likes: t("top"),
  };

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
          <Button
            isDisabled={totalCount <= 1}
            size="sm"
            variant="tertiary"
            aria-label={t("chooseSort")}
          >
            {sortLabels[sortOrder]}
            <Icon icon="gravity-ui:chevron-down" aria-hidden="true" className="size-3.5" />
          </Button>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu
              selectedKeys={new Set<Key>([sortOrder])}
              selectionMode="single"
              onAction={(key) => {
                if (isSortOrder(key)) setSortOrder(key);
              }}
            >
              {SORT_ORDERS.map((key) => {
                const label = sortLabels[key];
                return (
                  <Dropdown.Item key={key} id={key} textValue={label}>
                    <Label>{label}</Label>
                    <Dropdown.ItemIndicator />
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      {newCount > 0 ? (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="secondary"
            isPending={isLoadingNew}
            isDisabled={isLoadingNew}
            aria-live="polite"
            onPress={onLoadNew}
          >
            <Icon icon="gravity-ui:arrow-up" aria-hidden="true" className="size-3.5" />
            {isGuestbook
              ? t("newEntries", { count: newCount })
              : t("newComments", { count: newCount })}
          </Button>
        </div>
      ) : null}
    </div>
  );
});
