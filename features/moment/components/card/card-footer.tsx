"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface CardFooterProps {
  isLiked: boolean;
  isLiking: boolean;
  likesCount: number;
  onLikeToggle: () => void;
}

export const CardFooter = ({ isLiked, isLiking, likesCount, onLikeToggle }: CardFooterProps) => {
  return (
    <div className="flex w-full flex-row items-center justify-between p-4 pt-3">
      <div className="flex flex-row items-center gap-1">
        <Button
          size="sm"
          variant={isLiked ? "danger" : "ghost"}
          onPress={onLikeToggle}
          isPending={isLiking}
          aria-label={isLiked ? "Unlike moment" : "Like moment"}
          className="gap-1.5"
        >
          <Icon
            icon={isLiked ? "gravity-ui:heart-fill" : "gravity-ui:heart"}
            className={`size-4.5 ${isLiked ? "text-danger" : ""}`}
          />
          <span className="text-xs tabular-nums">{likesCount}</span>
        </Button>

        <Button size="sm" isIconOnly variant="ghost" aria-label="Comment">
          <Icon icon="gravity-ui:comment" className="size-4.5" />
        </Button>
      </div>
    </div>
  );
};
