"use client";

import {
  ArrowShapeTurnUpLeft,
  Ellipsis,
  Flag,
  Heart,
  HeartFill,
  Link,
  Pencil,
  TrashBin,
} from "@gravity-ui/icons";
import { Button, Dropdown, Separator, Tooltip } from "@heroui/react";
import { MotionButton } from "@/components/ui";
import { useCommentContext } from "./context/comment-context";
import type { EnhancedComment } from "./types";

interface CommentActionsProps {
  comment: EnhancedComment;
  onLikeToggle: () => void;
  onReplyToggle: () => void;
  onEditStart: () => void;
  onDelete: () => void;
  onReport: () => void;
  onCopyLink: () => void;
  isReplying: boolean;
  depth: number;
}

export function CommentActions({
  comment,
  onLikeToggle,
  onReplyToggle,
  onEditStart,
  onDelete,
  onReport,
  onCopyLink,
  isReplying,
  depth,
}: CommentActionsProps) {
  const { currentUser, isAuthenticated } = useCommentContext();
  const normalizedUser = currentUser?.toLowerCase();
  const isAuthor =
    Boolean(isAuthenticated && normalizedUser) &&
    (normalizedUser === (comment.username ?? "").toLowerCase() ||
      normalizedUser === comment.nickname?.toLowerCase());
  const isUnavailable = Boolean(comment.isPending || comment.isFailed);
  const isUnapproved = comment.status === "PENDING" || comment.id < 0;

  return (
    <div role="group" aria-label="Comment actions" className="mt-3 flex items-center gap-1">
      <MotionButton
        className="text-muted hover:bg-default-100 hover:text-foreground h-8 min-w-0 gap-1.5 rounded-md px-2 text-xs"
        size="sm"
        variant="ghost"
        aria-label={comment.likedByCurrentUser ? "Unlike comment" : "Like comment"}
        isDisabled={isUnavailable}
        whileTap={{ scale: 0.92 }}
        onPress={onLikeToggle}
      >
        {comment.likedByCurrentUser ? <HeartFill className="text-danger" /> : <Heart />}
        <span className="tabular-nums">{comment.likesCount}</span>
      </MotionButton>

      <Separator orientation="vertical" className="mx-1 h-4" />

      {depth < 5 && (
        <MotionButton
          className="text-muted hover:bg-default-100 hover:text-foreground h-8 min-w-0 gap-1.5 rounded-md px-2 text-xs"
          size="sm"
          variant="ghost"
          isDisabled={isUnavailable || isUnapproved}
          whileTap={{ scale: 0.96 }}
          onPress={onReplyToggle}
        >
          <ArrowShapeTurnUpLeft aria-hidden="true" />
          {isReplying ? "Cancel" : "Reply"}
        </MotionButton>
      )}

      <Dropdown>
        <Tooltip delay={0}>
          <Tooltip.Trigger aria-label="More comment actions">
            <Button
              className="text-muted/60 hover:bg-default-100 hover:text-foreground h-8 min-w-0 rounded-md px-2 sm:opacity-50 sm:group-hover:opacity-100"
              size="sm"
              variant="ghost"
              aria-label="More comment actions"
              isDisabled={isUnavailable}
            >
              <Ellipsis aria-hidden="true" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>More actions</p>
          </Tooltip.Content>
        </Tooltip>
        <Dropdown.Popover>
          <Dropdown.Menu
            onAction={(key) => {
              if (key === "copy") onCopyLink();
              if (key === "edit") onEditStart();
              if (key === "delete") onDelete();
              if (key === "report") onReport();
            }}
          >
            <Dropdown.Item id="copy" textValue="Copy link">
              <Link />
              Copy link
            </Dropdown.Item>
            {isAuthor ? (
              <>
                <Dropdown.Item id="edit" textValue="Edit comment">
                  <Pencil />
                  Edit
                </Dropdown.Item>
                <Dropdown.Item id="delete" textValue="Delete comment" variant="danger">
                  <TrashBin />
                  Delete
                </Dropdown.Item>
              </>
            ) : (
              <Dropdown.Item id="report" textValue="Report comment" variant="danger">
                <Flag />
                Report
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
