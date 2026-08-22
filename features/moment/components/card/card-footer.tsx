"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface CardFooterProps {
  isLiked: boolean;
  isLiking: boolean;
  likesCount: number;
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
  onLikeToggle,
  isCommentsOpen = false,
  onCommentToggle,
  isBookmarked = false,
  onBookmarkToggle,
}: CardFooterProps) => {
  return (
    <div className="flex w-full flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-1">
        {/* Like Button */}
        <Button
          size="sm"
          variant={isLiked ? "danger" : "ghost"}
          onPress={onLikeToggle}
          isPending={isLiking}
          aria-label={isLiked ? "Unlike moment" : "Like moment"}
          className="gap-1.5 transition-all active:scale-95"
        >
          <Icon
            icon={isLiked ? "gravity-ui:heart-fill" : "gravity-ui:heart"}
            className={`size-4.5 transition-transform duration-200 ${isLiked ? "text-danger scale-110" : ""}`}
          />
          <span className="text-xs tabular-nums">{likesCount}</span>
        </Button>

        {/* Comment Toggle Button */}
        <Button
          size="sm"
          variant={isCommentsOpen ? "secondary" : "ghost"}
          onPress={onCommentToggle}
          aria-label="Toggle Comments"
          className="gap-1.5 transition-all active:scale-95"
        >
          <Icon
            icon={isCommentsOpen ? "gravity-ui:comment-text-fill" : "gravity-ui:comment"}
            className={`size-4.5 ${isCommentsOpen ? "text-primary" : ""}`}
          />
          <span className="text-xs">Comment</span>
        </Button>
      </div>

      {/* Bookmark Star Button */}
      <Button
        size="sm"
        variant={isBookmarked ? "secondary" : "ghost"}
        onPress={onBookmarkToggle}
        isIconOnly
        aria-label={isBookmarked ? "Remove Bookmark" : "Bookmark Moment"}
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
