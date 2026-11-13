"use client";

import { Button, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

import { ReactionButton } from "@/components/ui/reaction-button";
import { momentLayoutTransition, useMomentMotion } from "../feed-motion";

interface CardFooterProps {
  isLiked: boolean;
  isLiking: boolean;
  likesCount: number;
  commentsCount?: number;
  onLikeToggle: () => boolean;
  isCommentsOpen?: boolean;
  onCommentToggle?: () => void;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => boolean;
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
  const { enabled, reduced } = useMomentMotion();

  return (
    <motion.div
      className="flex w-full flex-row items-center justify-between"
      layout={enabled ? "position" : undefined}
      transition={{ layout: reduced ? { duration: 0 } : momentLayoutTransition }}
    >
      <div className="flex flex-row items-center gap-1">
        <Tooltip delay={300}>
          <ReactionButton
            size="sm"
            icon="heart"
            selected={isLiked}
            count={likesCount}
            showCount="positive"
            idleVariant="ghost"
            selectedVariant="danger-soft"
            selectedColor="danger"
            onSelectedChange={onLikeToggle}
            isPending={isLiking}
            animationEnabled={enabled && !reduced}
            label={isLiked ? t("unlike") : t("like")}
          />
          <Tooltip.Content>{isLiked ? t("unlike") : t("like")}</Tooltip.Content>
        </Tooltip>

        {onCommentToggle ? (
          <Button
            size="sm"
            variant={isCommentsOpen ? "secondary" : "ghost"}
            onPress={onCommentToggle}
            aria-label={t("openComments", { count: commentsCount })}
          >
            <Icon icon="gravity-ui:comment" className="size-4.5" />
            {commentsCount > 0 ? (
              <span className="text-xs tabular-nums">{commentsCount}</span>
            ) : null}
          </Button>
        ) : null}
      </div>

      <Tooltip delay={300}>
        <ReactionButton
          size="sm"
          icon="star"
          selected={isBookmarked}
          showCount={false}
          idleVariant="ghost"
          selectedVariant="secondary"
          selectedColor="warning"
          onSelectedChange={() => onBookmarkToggle?.() ?? false}
          isDisabled={!onBookmarkToggle}
          animationEnabled={enabled && !reduced}
          label={isBookmarked ? t("unsaveMoment") : t("saveMoment")}
        />
        <Tooltip.Content>{isBookmarked ? t("unsaveMoment") : t("saveMoment")}</Tooltip.Content>
      </Tooltip>
    </motion.div>
  );
};
