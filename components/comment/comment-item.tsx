"use client";

import { ArrowDown, ArrowRotateRight, ArrowUp } from "@gravity-ui/icons";
import { Avatar, Button, Chip, Typography, cn, toast } from "@heroui/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNow } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { MotionSurface } from "@/components/ui";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch } from "@/lib/hooks";
import { CommentActions } from "./comment-actions";
import { CommentContent } from "./comment-content";
import { CommentInput } from "./comment-input";
import { useCommentContext } from "./context/comment-context";
import type { EnhancedComment } from "./hooks/simulation-store";

interface CommentItemProps {
  comment: EnhancedComment;
  onLikeToggle: (id: number, isLiked: boolean, currentLikes: number) => void;
  onAuthenticationRequired?: () => void;
  onReplySubmit: (content: string, parentId: number) => Promise<void>;
  onEditSave: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  onReport: (id: number) => void;
  onRetry: (tempId: number, content: string, parentId: number | null) => Promise<void>;
}

interface ReplyRowProps extends Omit<CommentItemProps, "comment"> {
  comment: EnhancedComment;
  replyTo: string;
  replyToId: number;
  index: number;
}

const commentDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCommentTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? commentDateFormatter.format(new Date(timestamp)) : undefined;
}

function parseCommentDate(value: string) {
  const dateStr =
    value.includes("T") && !value.endsWith("Z") && !value.includes("+") ? `${value}Z` : value;
  const timestamp = new Date(dateStr).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function formatCompactCommentTime(value: string, now: Date) {
  const timestamp = parseCommentDate(value);
  if (timestamp === null) return "now";

  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - timestamp) / 1000));
  if (elapsedSeconds < 10) return "now";
  if (elapsedSeconds < 60) return `${elapsedSeconds}s`;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}m`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}d`;

  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(
    new Date(timestamp)
  );
}

function getDisplayName(comment: EnhancedComment) {
  return comment.nickname || comment.username || "Anonymous";
}

function flattenReplies(root: EnhancedComment) {
  const rows: Array<{ comment: EnhancedComment; replyTo: string; replyToId: number }> = [];
  const visit = (parent: EnhancedComment, children: EnhancedComment[]) => {
    for (const child of children) {
      rows.push({ comment: child, replyTo: getDisplayName(parent), replyToId: parent.id });
      visit(child, child.children ?? []);
    }
  };
  visit(root, root.children ?? []);
  return rows;
}

export function CommentItem(props: CommentItemProps) {
  const { comment } = props;
  const { highlightedCommentId } = useCommentContext();
  const replies = useMemo(() => flattenReplies(comment), [comment]);
  const shouldReduceMotion = useReducedMotion();
  const hasHighlightedReply = replies.some(
    ({ comment: reply }) => reply.id === highlightedCommentId
  );
  const [isExpanded, setIsExpanded] = useState(hasHighlightedReply);
  const repliesId = `comment-replies-${comment.id}`;

  useEffect(() => {
    if (!hasHighlightedReply) return;
    const timer = window.setTimeout(() => setIsExpanded(true), 0);
    return () => window.clearTimeout(timer);
  }, [hasHighlightedReply]);

  return (
    <MotionSurface
      className={cn(
        "group scroll-mt-24 rounded-none px-1 py-5 first:pt-0 sm:px-2",
        highlightedCommentId === comment.id && "bg-default-100/60"
      )}
      variant="transparent"
      layout
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <article id={`comment-card-${comment.id}`}>
        <CommentRow {...props} comment={comment} depth={1} />

        {replies.length > 0 && (
          <div className="border-border/40 mt-4 ml-8 border-l pl-3 sm:ml-10 sm:pl-4">
            <Button
              className="text-muted hover:text-foreground h-auto min-h-0 min-w-0 gap-1 px-0 py-0 text-xs"
              size="sm"
              variant="ghost"
              aria-controls={repliesId}
              aria-expanded={isExpanded}
              onPress={() => setIsExpanded((expanded) => !expanded)}
            >
              {isExpanded ? (
                <ArrowUp aria-hidden="true" className="size-3.5" />
              ) : (
                <ArrowDown aria-hidden="true" className="size-3.5" />
              )}
              {isExpanded ? "Hide" : "View"} {replies.length}{" "}
              {replies.length === 1 ? "reply" : "replies"}
            </Button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  id={repliesId}
                  initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 flex flex-col gap-5">
                    {replies.map(({ comment: reply, replyTo, replyToId }, index) => (
                      <ReplyRow
                        key={reply.id}
                        {...props}
                        comment={reply}
                        index={index}
                        replyTo={replyTo}
                        replyToId={replyToId}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </article>
    </MotionSurface>
  );
}

function ReplyRow({ comment, replyTo, replyToId, index, ...props }: ReplyRowProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      id={`comment-card-${comment.id}`}
      className="scroll-mt-24"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: shouldReduceMotion ? 0 : index * 0.05, ease: "easeOut" }}
    >
      <CommentRow {...props} comment={comment} depth={2} replyTo={replyTo} replyToId={replyToId} />
    </motion.article>
  );
}

function CommentRow({
  comment,
  depth,
  replyTo,
  onLikeToggle,
  onAuthenticationRequired,
  onReplySubmit,
  onEditSave,
  onDelete,
  onReport,
  onRetry,
  replyToId,
}: CommentItemProps & { depth: number; replyTo?: string; replyToId?: number }) {
  const now = useNow();
  const {
    activeReplyId,
    setActiveReplyId,
    highlightedCommentId,
    setHighlightedCommentId,
    isAuthenticated,
  } = useCommentContext();
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useAppDispatch();
  const isReplying = activeReplyId === comment.id;
  const isHighlighted = highlightedCommentId === comment.id;
  const isDeleted = comment.isDeleted === true;
  const displayName = getDisplayName(comment);
  const initialLetter = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!isHighlighted) return;
    const timer = window.setTimeout(
      () =>
        document
          .getElementById(`comment-card-${comment.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      0
    );
    const clearHighlightTimer = window.setTimeout(() => setHighlightedCommentId(null), 420);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearHighlightTimer);
    };
  }, [comment.id, isHighlighted, setHighlightedCommentId]);

  const copyCommentLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.hash = `comment-${comment.id}`;
      await navigator.clipboard.writeText(url.toString());
      toast.success("Comment link copied.");
    } catch {
      toast.warning("Could not copy the comment link.");
    }
  };

  return (
    <div className={cn("group flex gap-3", depth === 1 ? "sm:gap-4" : "sm:gap-3")}>
      <Avatar size={depth === 1 ? "md" : "sm"} variant="soft" className="shrink-0">
        {comment.avatar && <Avatar.Image src={comment.avatar} alt={displayName} />}
        <Avatar.Fallback>{initialLetter}</Avatar.Fallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-x-1.5 gap-y-1 leading-tight">
          <Typography className="max-w-full truncate" type="body-sm" weight="semibold">
            {displayName}
          </Typography>
          {replyTo && replyToId !== undefined && (
            <Button
              className="text-muted hover:text-foreground h-auto min-h-0 min-w-0 px-0 py-0 text-xs"
              size="sm"
              variant="ghost"
              aria-label={`Reply to ${replyTo}`}
              onPress={() => setHighlightedCommentId(replyToId)}
            >
              → {replyTo}
            </Button>
          )}
          <time
            className="text-muted/60 text-xs"
            dateTime={comment.createdAt}
            title={formatCommentTimestamp(comment.createdAt)}
          >
            · {formatCompactCommentTime(comment.createdAt, now)}
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
        </header>

        <div className="mt-1">
          <CommentContent
            content={comment.content}
            isEdited={comment.isEdited}
            isEditing={isEditing}
            isDeleted={isDeleted}
            isReported={comment.isReported}
            onEditCancel={() => setIsEditing(false)}
            onEditSave={(content) => {
              onEditSave(comment.id, content);
              setIsEditing(false);
            }}
          />
        </div>

        {!isDeleted && !isEditing && comment.isFailed && (
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

        {!isDeleted &&
          !isEditing &&
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
      </div>
    </div>
  );
}
