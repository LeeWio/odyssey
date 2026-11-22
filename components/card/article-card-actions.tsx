"use client";

import { Bookmark, Check, Ellipsis, Link as LinkIcon, PaperPlane } from "@gravity-ui/icons";
import { Button, Dropdown, Label, Tooltip, toast } from "@heroui/react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useReadingListAction } from "@/features/library/reading-list-button";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import { useGetReadingListMembershipQuery } from "@/lib/features/library";
import { useAppSelector } from "@/lib/hooks";
import type { ArticleCardPost } from "./article-card";

type ActionPost = Pick<ArticleCardPost, "id" | "slug">;

export function ArticleCardActions({
  post,
  href,
  compact = false,
}: {
  post: ActionPost;
  href: string;
  compact?: boolean;
}) {
  const username = useAppSelector(selectCurrentUser);
  return (
    <ArticleCardMenu
      key={`${username ?? "guest"}:${href}`}
      post={post}
      href={href}
      compact={compact}
    />
  );
}

function ArticleCardMenu({
  post,
  href,
  compact,
}: {
  post: ActionPost;
  href: string;
  compact: boolean;
}) {
  const t = useTranslations("Article");
  const card = useTranslations("ArticleCard");
  const [isOpen, setIsOpen] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const canSave = post.id != null;
  const details = useGetReadingListMembershipQuery(
    isAuthenticated && username && post.id != null && isOpen
      ? { username, postId: post.id }
      : skipToken,
    { refetchOnMountOrArgChange: true }
  );
  const hasMembership = typeof details.currentData === "boolean";
  const isChecking = isAuthenticated && canSave && (details.isFetching || details.isUninitialized);
  const { saved, busy, toggle } = useReadingListAction({
    postId: post.id,
    isSaved: details.currentData === true,
    isRefreshing: isChecking,
  });
  const saveLabel = isChecking
    ? card("checking")
    : isAuthenticated && details.isError
      ? card("retrySave")
      : saved
        ? card("removeSaved")
        : t("saveForLater");

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).href);
      if (compact) {
        toast.success(card("copied"));
      } else {
        setIsShared(true);
        window.setTimeout(() => setIsShared(false), 1800);
      }
    } catch {
      setIsShared(false);
      toast.danger(t("linkCopyFailed"));
    }
  }

  const disabledKeys = [
    ...(!canSave || busy || (isAuthenticated && !hasMembership && !details.isError)
      ? ["save-article"]
      : []),
    ...(!post.slug ? ["copy-link"] : []),
  ];

  return (
    <div className="flex shrink-0 items-center gap-2">
      {!compact ? (
        <Button
          aria-label={isShared ? card("copied") : card("share")}
          isDisabled={!post.slug}
          isIconOnly
          size="sm"
          onPress={() => void handleShare()}
        >
          {isShared ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <PaperPlane aria-hidden="true" className="size-4" />
          )}
        </Button>
      ) : null}
      <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <Button
            aria-label={card("actions")}
            className={compact ? "min-h-11 min-w-11 sm:min-h-9 sm:min-w-9" : undefined}
            isIconOnly
            size="sm"
            variant={compact ? "ghost" : "outline"}
          >
            <Ellipsis aria-hidden="true" className="size-4" />
          </Button>
          <Tooltip.Content>{card("actions")}</Tooltip.Content>
        </Tooltip>
        <Dropdown.Popover>
          <Dropdown.Menu
            disabledKeys={disabledKeys}
            onAction={(key) => {
              if (key === "copy-link") void handleShare();
              if (key === "save-article") {
                if (details.isError) void details.refetch();
                else void toggle();
              }
            }}
          >
            <Dropdown.Item id="save-article" textValue={saveLabel}>
              <Bookmark aria-hidden="true" className="text-muted size-4" />
              <Label>{saveLabel}</Label>
            </Dropdown.Item>
            <Dropdown.Item id="copy-link" textValue={card("copy")}>
              <LinkIcon aria-hidden="true" className="text-muted size-4" />
              <Label>{card("copy")}</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
