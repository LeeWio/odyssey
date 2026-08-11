"use client";

import { Ellipsis, Flag, Heart, HeartFill, Link, Pencil, TrashBin } from "@gravity-ui/icons";
import { Button, Dropdown } from "@heroui/react";
import { useCommentContext } from "./context/comment-context";
import type { EnhancedComment } from "./hooks/simulation-store";

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
    (normalizedUser === comment.username.toLowerCase() ||
      normalizedUser === comment.nickname?.toLowerCase());
  const isUnavailable = Boolean(comment.isPending || comment.isFailed);
  const isUnapproved = comment.status === "PENDING" || comment.id < 0;

  return (
    <div role="group" aria-label="Comment actions" className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        aria-label={comment.isLiked ? "Unlike comment" : "Like comment"}
        isDisabled={isUnavailable}
        onPress={onLikeToggle}
      >
        {comment.isLiked ? <HeartFill className="text-danger" /> : <Heart />}
        <span>{comment.likesCount}</span>
      </Button>

      {depth < 5 && (
        <Button
          size="sm"
          variant="ghost"
          isDisabled={isUnavailable || isUnapproved}
          onPress={onReplyToggle}
        >
          {isReplying ? "Cancel" : "Reply"}
        </Button>
      )}

      <Dropdown>
        <Button
          size="sm"
          variant="ghost"
          aria-label="More comment actions"
          isDisabled={isUnavailable}
        >
          <Ellipsis aria-hidden="true" />
        </Button>
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
