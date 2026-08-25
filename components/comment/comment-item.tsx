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
import type { EnhancedComment } from "./types";

interface CommentItemProps {
  comment: EnhancedComment;
  onLikeToggle: (id: number, isLiked: boolean) => void;
  onAuthenticationRequired?: () => void;
  onReplySubmit: (content: string, parentId: number) => Promise<void>;
  onEditSave: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  onReport: (id: number) => void;
  onRetry: (tempId: number, content: string, parentId: number | null) => Promise<void>;
  onLoadReplies: (parentId: number) => Promise<void>;
  loadingReplyIds: Set<number>;
  hasMoreReplies: (parentId: number) => boolean;
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
  const replyTotal = Math.max(comment.replyCount ?? 0, replies.length);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimateEntry = !comment.isPending && !shouldReduceMotion;
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
      className="group scroll-mt-24 px-1 py-6 first:pt-2 sm:px-2"
      variant={highlightedCommentId === comment.id ? "secondary" : "transparent"}
      initial={shouldAnimateEntry ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldAnimateEntry ? { opacity: 0, y: -8 } : undefined}
      transition={shouldAnimateEntry ? { duration: 0.22, ease: "easeOut" } : { duration: 0 }}
    >
      <article id={`comment-card-${comment.id}`}>
        <CommentRow {...props} comment={comment} depth={1} />

        {(replies.length > 0 || replyTotal > 0) && (
          <div className="mt-5 ml-5 pl-4 sm:ml-12 sm:pl-5">
            <Button
              size="sm"
              variant="ghost"
              aria-controls={repliesId}
              aria-expanded={isExpanded}
              onPress={async () => {
                if (!isExpanded && replies.length === 0 && replyTotal > 0) {
                  await props.onLoadReplies(comment.id);
                }
                setIsExpanded((expanded) => !expanded);
              }}
            >
              {isExpanded ? (
                <ArrowUp aria-hidden="true" className="size-3.5" />
              ) : (
                <ArrowDown aria-hidden="true" className="size-3.5" />
              )}
              {props.loadingReplyIds.has(comment.id)
                ? "Loading replies..."
                : `${isExpanded ? "Hide" : "View"} ${replyTotal} ${replyTotal === 1 ? "reply" : "replies"}`}
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
                  {isExpanded && props.hasMoreReplies(comment.id) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-3 ml-1 self-start"
                      onPress={() => props.onLoadReplies(comment.id)}
                      isDisabled={props.loadingReplyIds.has(comment.id)}
                    >
                      Load more replies
                    </Button>
                  )}
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
  const isDeleted = comment.deletedPlaceholder === true;
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
        <header className="flex flex-wrap items-center gap-x-2 gap-y-1.5 leading-tight">
          <Typography truncate type="body-sm" weight="semibold">
            {displayName}
          </Typography>
          {replyTo && replyToId !== undefined && (
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Reply to ${replyTo}`}
              onPress={() => setHighlightedCommentId(replyToId)}
            >
              → {replyTo}
            </Button>
          )}
          <Typography color="muted" type="body-xs" className="tabular-nums">
            <time dateTime={comment.createdAt} title={formatCommentTimestamp(comment.createdAt)}>
              · {formatCompactCommentTime(comment.createdAt, now)}
            </time>
          </Typography>
          {comment.pinned && (
            <Chip size="sm" variant="soft" color="accent">
              Pinned
            </Chip>
          )}
          {comment.featured && (
            <Chip size="sm" variant="soft" color="warning">
              Featured
            </Chip>
          )}
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

        <div className="mt-2 max-w-[68ch]">
          <CommentContent
            content={comment.content}
            isEdited={Boolean(comment.editedAt)}
            isEditing={isEditing}
            isDeleted={isDeleted}
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
            onPress={() => onRetry(comment.id, comment.content, comment.parentId ?? null)}
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
              onLikeToggle={() => onLikeToggle(comment.id, Boolean(comment.likedByCurrentUser))}
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
