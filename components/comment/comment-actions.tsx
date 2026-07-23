"use client";

import React from "react";
import { Button, Tooltip, Dropdown, cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useCommentContext } from "./context/comment-context";
import { EnhancedComment } from "./hooks/simulation-store";

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
    <div className="flex items-center gap-1.5">
      {/* 1. Like Pill (Heart + Count) styled like the reference image */}
      <Button
        size="sm"
        variant="ghost"
        onPress={onLikeToggle}
        isDisabled={isSimulatedOrPending}
        className={cn(
          "border-default-200/50 bg-default-50/50 h-7 min-w-0 rounded-full border px-2.5 transition-all active:scale-95",
          comment.isLiked && "border-danger/20 bg-danger/10 text-danger",
          "hover:border-danger/30 hover:bg-danger/10 hover:text-danger"
        )}
      >
        <Icon
          icon={comment.isLiked ? "ph:heart-fill" : "ph:heart-bold"}
          className={cn(
            "size-3.5",
            comment.isLiked ? "text-danger" : "text-default-400 group-hover:text-danger"
          )}
        />
        {comment.likesCount > 0 && (
          <span className="text-default-600 ml-1.5 text-xs font-semibold tabular-nums">
            {comment.likesCount}
          </span>
        )}
      </Button>

      {/* 2. Clean Text Reply Button */}
      {depth < 5 && (
        <Tooltip delay={300}>
          <Button
            size="sm"
            variant="ghost"
            onPress={onReplyToggle}
            isDisabled={isSimulatedOrPending || isUnapproved}
            className={cn(
              "text-default-500 hover:text-foreground hover:bg-default-100 h-7 min-w-0 rounded-full border-none bg-transparent px-3 text-xs font-semibold transition-colors",
              isReplying && "bg-default-100 text-foreground"
            )}
          >
            Reply
          </Button>
          <Tooltip.Content>
            {isUnapproved ? "Replies disabled" : isReplying ? "Cancel" : "Reply"}
          </Tooltip.Content>
        </Tooltip>
      )}

      {/* 3. Options Menu Dropdown (...) next to Reply */}
      <Dropdown>
        <Dropdown.Trigger
          className={cn(
            "text-default-400 hover:bg-default-100 hover:text-foreground flex h-7 w-7 min-w-0 items-center justify-center rounded-full p-0 transition-colors active:scale-95",
            isSimulatedOrPending && "pointer-events-none opacity-50"
          )}
        >
          <Icon icon="lucide:more-horizontal" className="size-3.5" />
        </Dropdown.Trigger>
        <Dropdown.Popover className="min-w-[150px]">
          <Dropdown.Menu
            onAction={(key) => {
              if (key === "edit") onEditStart();
              else if (key === "delete") onDelete();
              else if (key === "report") onReport();
            }}
          >
            {isAuthor ? (
              [
                <Dropdown.Item key="edit" textValue="Edit Comment">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:pencil" className="size-3.5" />
                    <span className="text-xs">Edit</span>
                  </div>
                </Dropdown.Item>,
                <Dropdown.Item key="delete" textValue="Delete Comment" variant="danger">
                  <div className="text-danger flex items-center gap-2">
                    <Icon icon="lucide:trash-2" className="size-3.5" />
                    <span className="text-xs font-semibold">Delete</span>
                  </div>
                </Dropdown.Item>,
              ]
            ) : (
              <Dropdown.Item key="report" textValue="Report Comment" variant="danger">
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
