"use client";

import { ArrowRotateRight, ChevronDown } from "@gravity-ui/icons";
import { Avatar, Button, Chip, cn, toast } from "@heroui/react";
import { useState } from "react";
import { setLoginOpen } from "@/lib/features/auth";
import { useAppDispatch } from "@/lib/hooks";
import { CommentActions } from "./comment-actions";
import { CommentContent } from "./comment-content";
import { CommentInput } from "./comment-input";
import { useCommentContext } from "./context/comment-context";
import type { EnhancedComment } from "./hooks/simulation-store";

interface CommentItemProps {
  comment: EnhancedComment;
  depth?: number;
  onLikeToggle: (id: number, isLiked: boolean, currentLikes: number) => void;
  onReplySubmit: (content: string, parentId: number) => Promise<void>;
  onEditSave: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  onReport: (id: number) => void;
  onRetry: (tempId: number, content: string, parentId: number | null) => Promise<void>;
}

function formatCommentDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Just now";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

export function CommentItem({
  comment,
  depth = 1,
  onLikeToggle,
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
    <article
      id={`comment-card-${comment.id}`}
      className={cn(
        "scroll-mt-24",
        isHighlighted && "bg-accent-soft/10 ring-accent/20 rounded-xl ring-1",
        isHighlighted && (depth === 1 ? "-m-3 p-3" : "p-3")
      )}
    >
      <div className="flex gap-3">
        <Avatar size="sm" variant="soft" className="shrink-0">
          {comment.avatar && <Avatar.Image src={comment.avatar} alt={displayName} />}
          <Avatar.Fallback>{initialLetter}</Avatar.Fallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold">{displayName}</span>
            <time className="text-muted text-xs" dateTime={comment.createdAt}>
              {formatCommentDate(comment.createdAt)}
            </time>
            {comment.isFailed && (
              <Chip size="sm" color="danger" variant="soft">
                Not sent
              </Chip>
            )}
            {comment.status === "PENDING" && !comment.isPending && (
              <Chip size="sm" color="warning" variant="soft">
                In review
              </Chip>
            )}
          </header>

          <div className="mt-1">
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

          {!isEditing && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
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
                    dispatch(setLoginOpen(true));
                    return;
                  }

                  setActiveReplyId(isReplying ? null : comment.id);
                }}
                onReport={() => onReport(comment.id)}
              />

              {comment.isFailed && (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => onRetry(comment.id, comment.content, comment.parentId)}
                >
                  <ArrowRotateRight />
                  Retry
                </Button>
              )}
            </div>
          )}

          {isReplying && (
            <CommentInput
              hideTrigger
              isOpen
              replyId={comment.id}
              replyTo={displayName}
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
              className="mt-1"
              aria-controls={repliesId}
              aria-expanded={isExpanded}
              onPress={() => setIsExpanded((value) => !value)}
            >
              <ChevronDown className={cn("transition-transform", isExpanded && "rotate-180")} />
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
          className="border-separator-tertiary mt-4 ml-4 flex flex-col gap-4 border-l pl-5"
        >
          {replies.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              depth={depth + 1}
              onDelete={onDelete}
              onEditSave={onEditSave}
              onLikeToggle={onLikeToggle}
              onReplySubmit={onReplySubmit}
              onReport={onReport}
              onRetry={onRetry}
            />
          ))}
        </div>
      )}
    </article>
  );
}
