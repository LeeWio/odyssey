"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface CardFooterProps {
  isLiked: boolean;
  isLiking: boolean;
  likesCount: number;
  commentsCount?: number;
  onLikeToggle: () => void;
  isCommentsOpen?: boolean;
  onCommentToggle?: () => void;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
}

export const CardFooter = ({
  isLiked,
  isLiking,
  likesCount,
  commentsCount = 0,
  onLikeToggle,
  isCommentsOpen = false,
  onCommentToggle,
  isBookmarked = false,
  onBookmarkToggle,
}: CardFooterProps) => {
  const t = useTranslations("Moments");

  return (
    <div className="flex w-full flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-1">
        <Button
          size="sm"
          variant={isLiked ? "danger" : "ghost"}
          onPress={onLikeToggle}
          isPending={isLiking}
          aria-label={isLiked ? t("unlike") : t("like")}
          className="gap-1.5 transition-all active:scale-95"
        >
          <Icon
            icon={isLiked ? "gravity-ui:heart-fill" : "gravity-ui:heart"}
            className={`size-4.5 transition-transform duration-200 ${isLiked ? "text-danger scale-110" : ""}`}
          />
          {likesCount > 0 ? <span className="text-xs tabular-nums">{likesCount}</span> : null}
        </Button>

        {onCommentToggle ? (
          <Button
            size="sm"
            variant={isCommentsOpen ? "secondary" : "ghost"}
            onPress={onCommentToggle}
            aria-label={t("openComments", { count: commentsCount })}
            className="gap-1.5 transition-all active:scale-95"
          >
            <Icon icon="gravity-ui:comment" className="size-4.5" />
            {commentsCount > 0 ? (
              <span className="text-xs tabular-nums">{commentsCount}</span>
            ) : null}
          </Button>
        ) : null}
      </div>

      <Button
        size="sm"
        variant={isBookmarked ? "secondary" : "ghost"}
        onPress={onBookmarkToggle}
        isIconOnly
        aria-label={isBookmarked ? t("unsaveMoment") : t("saveMoment")}
        className="transition-all active:scale-95"
      >
        <Icon
          icon={isBookmarked ? "gravity-ui:star-fill" : "gravity-ui:star"}
          className={`size-4.5 ${isBookmarked ? "text-warning scale-110" : ""}`}
        />
      </Button>
    </div>
  );
};
