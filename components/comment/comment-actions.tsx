"use client";

import { Button, Tooltip, Dropdown } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useCommentContext } from "./context/comment-context";
import { EnhancedComment } from "./hooks/simulation-store";
import { EmojiReactionButton } from "@heroui-pro/react";

interface CommentActionsProps {
  comment: EnhancedComment;
  onLikeToggle: () => void;
  onReplyToggle: () => void;
  onEditStart: () => void;
  onDelete: () => void;
  onReport: () => void;
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
  isReplying,
  depth,
}: CommentActionsProps) {
  const { currentUser, isAuthenticated } = useCommentContext();

  const isAuthor =
    isAuthenticated &&
    currentUser &&
    (currentUser.toLowerCase() === comment.username.toLowerCase() ||
      currentUser.toLowerCase() === comment.nickname?.toLowerCase());

  const isSimulatedOrPending = comment.isPending || comment.isFailed;
  const isUnapproved = comment.status === "PENDING" || comment.id < 0;

  return (
    <div role="group" aria-label="Comment actions" className="flex items-center gap-1">
      <EmojiReactionButton
        size="sm"
        isSelected={comment.isLiked}
        onChange={onLikeToggle}
        isDisabled={isSimulatedOrPending}
      >
        <EmojiReactionButton.Emoji>❤️</EmojiReactionButton.Emoji>
        <EmojiReactionButton.Count>{comment.likesCount}</EmojiReactionButton.Count>
      </EmojiReactionButton>

      {depth < 5 && (
        <Tooltip delay={300}>
          <Button
            size="sm"
            variant={isReplying ? "primary" : "ghost"}
            onPress={onReplyToggle}
            isDisabled={isSimulatedOrPending || isUnapproved}
          >
            Reply
          </Button>
          <Tooltip.Content>
            {isUnapproved ? "Replies disabled" : isReplying ? "Cancel" : "Reply"}
          </Tooltip.Content>
        </Tooltip>
      )}

      <Dropdown>
        <Button
          size="sm"
          isIconOnly
          aria-label="Comment options"
          isDisabled={Boolean(isSimulatedOrPending)}
        >
          <Icon icon="lucide:more-horizontal" />
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu
            onAction={(key) => {
              if (key === "edit") onEditStart();
              else if (key === "delete") onDelete();
              else if (key === "report") onReport();
            }}
          >
            {isAuthor ? (
              [
                <Dropdown.Item key="edit" id="edit" textValue="Edit Comment">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:pencil" className="size-3.5" />
                    <span className="text-xs">Edit</span>
                  </div>
                </Dropdown.Item>,
                <Dropdown.Item key="delete" id="delete" textValue="Delete Comment" variant="danger">
                  <div className="text-danger flex items-center gap-2">
                    <Icon icon="lucide:trash-2" className="size-3.5" />
                    <span className="text-xs font-semibold">Delete</span>
                  </div>
                </Dropdown.Item>,
              ]
            ) : (
              <Dropdown.Item id="report" textValue="Report Comment" variant="danger">
                <div className="text-danger flex items-center gap-2">
                  <Icon icon="lucide:flag" className="size-3.5" />
                  <span className="text-xs">Report</span>
                </div>
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
