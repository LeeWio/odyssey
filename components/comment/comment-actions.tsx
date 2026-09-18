"use client";

import { Icon } from "@iconify/react";

import { Button, Dropdown, Tooltip } from "@heroui/react";
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
        size="sm"
        variant="ghost"
        aria-label={comment.likedByCurrentUser ? "Unlike comment" : "Like comment"}
        isDisabled={isUnavailable}
        whileTap={{ scale: 0.92 }}
        onPress={onLikeToggle}
      >
        {comment.likedByCurrentUser ? <Icon icon="gravity-ui:heart-fill" className="text-danger" /> : <Icon icon="gravity-ui:heart" />}
        <span className="tabular-nums">{comment.likesCount}</span>
      </MotionButton>

      {depth < 5 && (
        <MotionButton
          size="sm"
          variant="ghost"
          isDisabled={isUnavailable || isUnapproved}
          whileTap={{ scale: 0.96 }}
          onPress={onReplyToggle}
        >
          <Icon icon="gravity-ui:arrow-shape-turn-up-left" aria-hidden="true" />
          {isReplying ? "Cancel" : "Reply"}
        </MotionButton>
      )}

      <Dropdown>
        <Tooltip delay={0}>
          <Tooltip.Trigger aria-label="More comment actions">
            <Button
              size="sm"
              variant="ghost"
              aria-label="More comment actions"
              isDisabled={isUnavailable}
            >
              <Icon icon="gravity-ui:ellipsis" aria-hidden="true" />
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
              <Icon icon="gravity-ui:link" />
              Copy link
            </Dropdown.Item>
            {isAuthor ? (
              <>
                <Dropdown.Item id="edit" textValue="Edit comment">
                  <Icon icon="gravity-ui:pencil" />
                  Edit
                </Dropdown.Item>
                <Dropdown.Item id="delete" textValue="Delete comment" variant="danger">
                  <Icon icon="gravity-ui:trash-bin" />
                  Delete
                </Dropdown.Item>
              </>
            ) : (
              <Dropdown.Item id="report" textValue="Report comment" variant="danger">
                <Icon icon="gravity-ui:flag" />
                Report
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
