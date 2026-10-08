"use client";

import { Icon } from "@iconify/react";

import { Button, Typography, cn, toast } from "@heroui/react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { UserAvatar } from "@/components/user-avatar";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { microEaseOut } from "@/lib/motion";
import { useRelativeTime } from "@/lib/relative-time";
import { CommentActions } from "./comment-actions";
import { CommentContent } from "./comment-content";
import { CommentInput } from "./comment-input";
import { useCommentContext } from "./context/comment-context";
import type { GuestCommentIdentity } from "./hooks/use-comment-mutations";
import type { EnhancedComment } from "./types";
import { flattenReplies, getCommentDisplayName } from "./utils/thread";

interface CommentItemProps {
  comment: EnhancedComment;
  onLikeToggle: (id: number, isLiked: boolean, likesCount: number) => void;
  pendingLikeIds: ReadonlySet<number>;
  onAuthenticationRequired?: () => void;
  onReplySubmit: (
    content: string,
    parentId: number,
    guest?: GuestCommentIdentity
  ) => Promise<boolean>;
  onEditSave: (id: number, content: string) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onReport: (id: number, reason: string) => Promise<boolean>;
  onRetry: (
    tempId: number,
    content: string,
    parentId: number | null,
    guest?: GuestCommentIdentity
  ) => Promise<boolean>;
  onLoadReplies: (parentId: number) => Promise<boolean>;
  loadingReplyIds: Set<number>;
  hasMoreReplies: (parentId: number) => boolean;
}

interface ReplyRowProps extends Omit<CommentItemProps, "comment"> {
  comment: EnhancedComment;
  replyTo: string;
  replyToId: number;
}

const commentDateFormatters = new Map<string, Intl.DateTimeFormat>();

function formatCommentTimestamp(value: string, locale: string) {
  const dateStr =
    value.includes("T") && !value.endsWith("Z") && !value.includes("+") ? `${value}Z` : value;
  const timestamp = new Date(dateStr).getTime();
  if (!Number.isFinite(timestamp)) return undefined;
  let formatter = commentDateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
    commentDateFormatters.set(locale, formatter);
  }
  return formatter.format(new Date(timestamp));
}

function StatusHint({ comment }: { comment: EnhancedComment }) {
  const t = useTranslations("Comments");
  if (comment.isFailed) {
    return <span className="text-danger text-xs font-medium">{t("failedToSend")}</span>;
  }
  if (comment.isPending) {
    return <span className="text-muted text-xs">{t("sending")}</span>;
  }
  if (comment.status === "PENDING") {
    return <span className="text-warning text-xs font-medium">{t("awaitingReview")}</span>;
  }
  if (comment.pinned) {
    return <span className="text-muted text-xs">{t("pinned")}</span>;
  }
  if (comment.featured) {
    return <span className="text-muted text-xs">{t("featured")}</span>;
  }
  return null;
}

export function CommentItem(props: CommentItemProps) {
  const t = useTranslations("Comments");
  const { comment } = props;
  const { highlightedCommentId } = useCommentContext();
  const replies = useMemo(() => flattenReplies(comment), [comment]);
  const replyTotal = Math.max(comment.replyCount ?? 0, replies.length);
  const shouldReduceMotion = useReducedMotionPreference();
  const hasHighlightedReply = replies.some(
    ({ comment: reply }) => reply.id === highlightedCommentId
  );
  const [isExpanded, setIsExpanded] = useState(hasHighlightedReply);
  const repliesId = `comment-replies-${comment.id}`;
  const isHighlighted = highlightedCommentId === comment.id;

  useEffect(() => {
    if (!hasHighlightedReply) return;
    const timer = window.setTimeout(() => setIsExpanded(true), 0);
    return () => window.clearTimeout(timer);
  }, [hasHighlightedReply]);

  return (
    <article
      id={`comment-${comment.id}`}
      data-comment-card={comment.id}
      className={cn(
        "scroll-mt-24 py-4",
        isHighlighted &&
          "bg-accent/5 ring-accent/20 -mx-2 rounded-xl border-b-transparent px-2 ring-1"
      )}
    >
      <CommentRow {...props} comment={comment} depth={1} />

      {(replies.length > 0 || replyTotal > 0) && (
        <div className="mt-3 ml-10 sm:ml-12">
          <Button
            size="sm"
            variant="ghost"
            isDisabled={props.loadingReplyIds.has(comment.id)}
            aria-controls={repliesId}
            aria-expanded={isExpanded}
            onPress={async () => {
              if (!isExpanded && replies.length === 0 && replyTotal > 0) {
                if (!(await props.onLoadReplies(comment.id))) return;
              }
              setIsExpanded((expanded) => !expanded);
            }}
          >
            <Icon
              icon={isExpanded ? "gravity-ui:chevron-up" : "gravity-ui:chevron-down"}
              aria-hidden="true"
              className="size-3.5"
            />
            {props.loadingReplyIds.has(comment.id)
              ? t("loadingReplies")
              : isExpanded
                ? t("hideReplies", { count: replyTotal })
                : t("showReplies", { count: replyTotal })}
          </Button>

          <AnimatePresence initial={false}>
            {isExpanded ? (
              <motion.div
                id={repliesId}
                initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: microEaseOut }}
                className="overflow-hidden"
              >
                <div className="border-border/80 mt-3 space-y-4 border-l pl-4 sm:pl-5">
                  {replies.map(({ comment: reply, replyTo, replyToId }) => (
                    <ReplyRow
                      key={reply.id}
                      {...props}
                      comment={reply}
                      replyTo={replyTo}
                      replyToId={replyToId}
                    />
                  ))}
                  {props.hasMoreReplies(comment.id) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => props.onLoadReplies(comment.id)}
                      isDisabled={props.loadingReplyIds.has(comment.id)}
                    >
                      {t("loadMoreReplies")}
                    </Button>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}
    </article>
  );
}

function ReplyRow({ comment, replyTo, replyToId, ...props }: ReplyRowProps) {
  const { highlightedCommentId } = useCommentContext();
  const isHighlighted = highlightedCommentId === comment.id;

  return (
    <article
      id={`comment-${comment.id}`}
      className={cn(
        "scroll-mt-24",
        isHighlighted && "bg-accent/5 ring-accent/20 -ml-4 rounded-lg px-4 py-2 ring-1 sm:-ml-5"
      )}
    >
      <CommentRow {...props} comment={comment} depth={2} replyTo={replyTo} replyToId={replyToId} />
    </article>
  );
}

function CommentRow({
  comment,
  depth,
  replyTo,
  onLikeToggle,
  pendingLikeIds,
  onAuthenticationRequired,
  onReplySubmit,
  onEditSave,
  onDelete,
  onReport,
  onRetry,
  replyToId,
}: CommentItemProps & { depth: number; replyTo?: string; replyToId?: number }) {
  const t = useTranslations("Comments");
  const locale = useLocale();
  const formatRelativeTime = useRelativeTime();
  const { activeReplyId, setActiveReplyId, highlightedCommentId, setHighlightedCommentId } =
    useCommentContext();
  const [isEditing, setIsEditing] = useState(false);
  const isReplying = activeReplyId === comment.id;
  const isHighlighted = highlightedCommentId === comment.id;
  const isDeleted = comment.deletedPlaceholder === true;
  const displayName = getCommentDisplayName(comment);
  const timeLabel = formatRelativeTime(comment.createdAt);

  useEffect(() => {
    if (!isHighlighted) return;
    const timer = window.setTimeout(
      () =>
        document
          .getElementById(`comment-${comment.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      0
    );
    const clearHighlightTimer = window.setTimeout(() => setHighlightedCommentId(null), 2500);
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
      toast.success(t("linkCopied"));
    } catch {
      toast.warning(t("linkCopyFailed"));
    }
  };

  return (
    <div className="flex gap-3">
      <UserAvatar
        size="md"
        variant="soft"
        className="shrink-0"
        name={displayName}
        avatar={comment.avatar}
      />

      <div className="min-w-0 flex-1">
        <header className="flex min-w-0 flex-col gap-0.5">
          <Typography
            className="leading-none"
            truncate
            align="start"
            type="body-sm"
            weight="semibold"
          >
            {displayName}
          </Typography>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <Typography
              truncate
              align="start"
              type="body-xs"
              color="muted"
              className="tabular-nums"
            >
              <time
                dateTime={comment.createdAt}
                title={formatCommentTimestamp(comment.createdAt, locale)}
              >
                {timeLabel}
              </time>
            </Typography>
            {replyTo && replyToId !== undefined ? (
              <button
                type="button"
                aria-label={t("jumpTo", { name: replyTo })}
                onClick={() => setHighlightedCommentId(replyToId)}
              >
                <span aria-hidden="true">{t("repliedTo")}</span>
                <span className="font-medium">{replyTo}</span>
              </button>
            ) : null}
            <StatusHint comment={comment} />
          </div>
        </header>

        <div className="mt-1.5">
          <CommentContent
            content={comment.content}
            isEdited={Boolean(comment.editedAt)}
            isEditing={isEditing}
            isDeleted={isDeleted}
            onEditCancel={() => setIsEditing(false)}
            onEditSave={(content) => onEditSave(comment.id, content)}
          />
        </div>

        {!isDeleted && !isEditing && comment.isFailed ? (
          <Button
            className="mt-2"
            size="sm"
            variant="secondary"
            onPress={() =>
              onRetry(
                comment.id,
                comment.content,
                comment.parentId ?? null,
                comment.anonymous && comment.nickname ? { guestName: comment.nickname } : undefined
              )
            }
          >
            <Icon icon="gravity-ui:arrow-rotate-right" aria-hidden="true" />
            {t("retry")}
          </Button>
        ) : null}

        {!isDeleted && !isEditing && !comment.isFailed && !comment.isPending ? (
          <CommentActions
            comment={comment}
            isLiking={pendingLikeIds.has(comment.id)}
            depth={depth}
            isReplying={isReplying}
            onCopyLink={copyCommentLink}
            onDelete={() => onDelete(comment.id)}
            onEditStart={() => setIsEditing(true)}
            onLikeToggle={() =>
              onLikeToggle(comment.id, Boolean(comment.likedByCurrentUser), comment.likesCount ?? 0)
            }
            onReplyToggle={() => {
              setActiveReplyId(isReplying ? null : comment.id);
            }}
            onReport={(reason) => onReport(comment.id, reason)}
          />
        ) : null}

        {isReplying ? (
          <CommentInput
            hideTrigger
            isOpen
            replyId={comment.id}
            replyTo={displayName}
            onAuthenticationRequired={onAuthenticationRequired}
            placeholder={t("replyPlaceholder", { name: displayName })}
            submitButtonText={t("reply")}
            onOpenChange={(open) => {
              if (!open) setActiveReplyId(null);
            }}
            onSubmit={(content, guest) => onReplySubmit(content, comment.id, guest)}
          />
        ) : null}
      </div>
    </div>
  );
}
