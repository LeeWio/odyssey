"use client";

import { ArrowRotateRight, ChevronDown } from "@gravity-ui/icons";
import { Avatar, Button, Chip, Surface, Typography, cn, toast } from "@heroui/react";
import { useState } from "react";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch } from "@/lib/hooks";
import { formatRelativeTime } from "@/lib/relative-time";
import { CommentActions } from "./comment-actions";
import { CommentContent } from "./comment-content";
import { CommentInput } from "./comment-input";
import { useCommentContext } from "./context/comment-context";
import type { EnhancedComment } from "./hooks/simulation-store";

interface CommentItemProps {
  comment: EnhancedComment;
  depth?: number;
  onLikeToggle: (id: number, isLiked: boolean, currentLikes: number) => void;
  onAuthenticationRequired?: () => void;
  onReplySubmit: (content: string, parentId: number) => Promise<void>;
  onEditSave: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  onReport: (id: number) => void;
  onRetry: (tempId: number, content: string, parentId: number | null) => Promise<void>;
}

const commentDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCommentTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? commentDateFormatter.format(new Date(timestamp)) : undefined;
}

export function CommentItem({
  comment,
  depth = 1,
  onLikeToggle,
  onAuthenticationRequired,
  onReplySubmit,
  onEditSave,
  onDelete,
  onReport,
  onRetry,
}: CommentItemProps) {
  const { activeReplyId, setActiveReplyId, highlightedCommentId, isAuthenticated } =
    useCommentContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dispatch = useAppDispatch();
  const isReplying = activeReplyId === comment.id;
  const isHighlighted = highlightedCommentId === comment.id;
  const replies = comment.children ?? [];
  const hasReplies = replies.length > 0;
  const displayName = comment.nickname || comment.username || "Anonymous";
  const initialLetter = comment.username ? comment.username.slice(0, 2).toUpperCase() : "AN";
  const repliesId = `comment-replies-${comment.id}`;

  const copyCommentLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.hash = `comment-${comment.id}`;
      await navigator.clipboard.writeText(url.toString());
      toast.success("Comment link copied.");
    } catch (error) {
      console.error("Failed to copy comment link:", error);
      toast.warning("Could not copy the comment link.");
    }
  };

  return (
    <Surface
      className={cn(
        depth === 1 && "rounded-3xl p-4 sm:p-5",
        depth > 1 && "p-0",
        isHighlighted && "ring-accent/30 ring-1"
      )}
      variant={depth === 1 ? "tertiary" : "transparent"}
    >
      <article id={`comment-card-${comment.id}`} className="scroll-mt-24">
        <div className="flex gap-3 sm:gap-4">
          <Avatar size={depth === 1 ? "md" : "sm"} variant="soft" className="shrink-0">
            {comment.avatar && <Avatar.Image src={comment.avatar} alt={displayName} />}
            <Avatar.Fallback>{initialLetter}</Avatar.Fallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <header className="flex flex-col items-start gap-1">
              <Typography className="max-w-full truncate" type="body-sm" weight="semibold">
                {displayName}
              </Typography>
              <div className="flex flex-wrap items-center gap-2">
                <time
                  className="text-muted text-xs"
                  dateTime={comment.createdAt}
                  title={formatCommentTimestamp(comment.createdAt)}
                >
                  {formatRelativeTime(comment.createdAt, { fallback: "Just now" })}
                </time>
                {comment.isFailed ? (
                  <Chip size="sm" color="danger" variant="soft">
                    Not sent
                  </Chip>
                ) : comment.isPending ? (
                  <Chip size="sm" variant="soft">
                    Sending
                  </Chip>
                ) : comment.status === "PENDING" ? (
                  <Chip size="sm" color="warning" variant="soft">
                    In review
                  </Chip>
                ) : null}
              </div>
            </header>

            <div className="mt-3">
              <CommentContent
                content={comment.content}
                isEdited={comment.isEdited}
                isEditing={isEditing}
                isReported={comment.isReported}
                onEditCancel={() => setIsEditing(false)}
                onEditSave={(content) => {
                  onEditSave(comment.id, content);
                  setIsEditing(false);
                }}
              />
            </div>

            {!isEditing && comment.isFailed && (
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                onPress={() => onRetry(comment.id, comment.content, comment.parentId)}
              >
                <ArrowRotateRight aria-hidden="true" />
                Retry
              </Button>
            )}

            {!isEditing &&
              !comment.isFailed &&
              !comment.isPending &&
              comment.status !== "PENDING" && (
                <CommentActions
                  comment={comment}
                  depth={depth}
                  isReplying={isReplying}
                  onCopyLink={copyCommentLink}
                  onDelete={() => onDelete(comment.id)}
                  onEditStart={() => setIsEditing(true)}
                  onLikeToggle={() => onLikeToggle(comment.id, comment.isLiked, comment.likesCount)}
                  onReplyToggle={() => {
                    if (!isAuthenticated) {
                      onAuthenticationRequired?.();
                      dispatch(setLoginOpen(true));
                      return;
                    }

                    setActiveReplyId(isReplying ? null : comment.id);
                  }}
                  onReport={() => onReport(comment.id)}
                />
              )}

            {isReplying && (
              <CommentInput
                hideTrigger
                isOpen
                replyId={comment.id}
                replyTo={displayName}
                onAuthenticationRequired={onAuthenticationRequired}
                placeholder={`Reply to ${displayName}...`}
                submitButtonText="Post reply"
                onOpenChange={(open) => {
                  if (!open) setActiveReplyId(null);
                }}
                onSubmit={(content) => onReplySubmit(content, comment.id)}
              />
            )}

            {hasReplies && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                aria-controls={repliesId}
                aria-expanded={isExpanded}
                onPress={() => setIsExpanded((value) => !value)}
              >
                <ChevronDown
                  aria-hidden="true"
                  className={cn("transition-transform", isExpanded && "rotate-180")}
                />
                {isExpanded
                  ? "Hide replies"
                  : `View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
              </Button>
            )}
          </div>
        </div>

        {hasReplies && isExpanded && (
          <div
            id={repliesId}
            className="border-separator-tertiary mt-5 ml-5 flex flex-col gap-4 border-l pl-5"
          >
            {replies.map((child) => (
              <CommentItem
                key={child.id}
                comment={child}
                depth={depth + 1}
                onDelete={onDelete}
                onEditSave={onEditSave}
                onLikeToggle={onLikeToggle}
                onAuthenticationRequired={onAuthenticationRequired}
                onReplySubmit={onReplySubmit}
                onReport={onReport}
                onRetry={onRetry}
              />
            ))}
          </div>
        )}
      </article>
    </Surface>
  );
}
