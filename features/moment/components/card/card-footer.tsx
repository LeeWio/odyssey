"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { motion, useAnimationControls } from "motion/react";
import { useEffect, useRef } from "react";

import { pageEaseOut } from "@/lib/motion";
import { momentLayoutTransition, useMomentMotion } from "../feed-motion";

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
  const { enabled, reduced } = useMomentMotion();
  const likeAnimation = useAnimationControls();
  const bookmarkAnimation = useAnimationControls();
  const likePressed = useRef(false);
  const bookmarkPressed = useRef(false);

  useEffect(() => {
    if (!reduced) return;
    likeAnimation.stop();
    bookmarkAnimation.stop();
    likeAnimation.set({ scale: 1 });
    bookmarkAnimation.set({ scale: 1 });
  }, [bookmarkAnimation, likeAnimation, reduced]);

  useEffect(() => {
    if (!likePressed.current) return;
    likePressed.current = false;
    if (!enabled || reduced) return;
    void likeAnimation.start({
      scale: isLiked ? [1, 1.12, 1] : 1,
      transition: { duration: isLiked ? 0.18 : 0.1, ease: pageEaseOut },
    });
  }, [enabled, isLiked, likeAnimation, reduced]);

  useEffect(() => {
    if (!bookmarkPressed.current) return;
    bookmarkPressed.current = false;
    if (!enabled || reduced) return;
    void bookmarkAnimation.start({
      scale: isBookmarked ? [1, 1.1, 1] : 1,
      transition: { duration: isBookmarked ? 0.16 : 0.1, ease: pageEaseOut },
    });
  }, [bookmarkAnimation, enabled, isBookmarked, reduced]);

  return (
    <motion.div
      className="flex w-full flex-row items-center justify-between"
      layout={enabled ? "position" : undefined}
      transition={{ layout: reduced ? { duration: 0 } : momentLayoutTransition }}
    >
      <div className="flex flex-row items-center gap-1">
        <Button
          size="sm"
          variant={isLiked ? "danger-soft" : "ghost"}
          onPress={() => {
            likePressed.current = true;
            onLikeToggle();
          }}
          isPending={isLiking}
          aria-label={isLiked ? t("unlike") : t("like")}
        >
          <motion.span
            aria-hidden="true"
            className="inline-flex size-4.5 shrink-0"
            initial={false}
            animate={likeAnimation}
          >
            <Icon
              icon={isLiked ? "gravity-ui:heart-fill" : "gravity-ui:heart"}
              className="size-4.5"
            />
          </motion.span>
          {likesCount > 0 ? (
            <motion.span
              key={likesCount}
              className="min-w-[1ch] text-xs tabular-nums"
              initial={enabled && !reduced ? { opacity: 0.4 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.12 }}
            >
              {likesCount}
            </motion.span>
          ) : null}
        </Button>

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

      <Button
        size="sm"
        variant={isBookmarked ? "secondary" : "ghost"}
        onPress={() => {
          bookmarkPressed.current = true;
          onBookmarkToggle?.();
        }}
        isIconOnly
        aria-label={isBookmarked ? t("unsaveMoment") : t("saveMoment")}
        className={enabled ? undefined : "transition-all active:scale-95"}
      >
        <motion.span
          aria-hidden="true"
          className="inline-flex size-4.5 shrink-0"
          initial={false}
          animate={bookmarkAnimation}
        >
          <Icon
            icon={isBookmarked ? "gravity-ui:star-fill" : "gravity-ui:star"}
            className={`size-4.5 ${isBookmarked ? "text-warning" : ""}`}
          />
        </motion.span>
      </Button>
    </motion.div>
  );
};
