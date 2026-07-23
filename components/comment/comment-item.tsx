"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Avatar, Button, Chip, Typography, cn, Dropdown, Card } from "@heroui/react";
import { HoverCard } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useCommentContext } from "./context/comment-context";
import { CommentActions } from "./comment-actions";
import { CommentContent } from "./comment-content";
import { CommentInput } from "./comment-input";
import { EnhancedComment } from "./hooks/simulation-store";
import { useAppDispatch } from "@/lib/hooks";
import { setLoginOpen } from "@/lib/features/auth";

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

  // Perfect mathematical recursion for thread lines!
  // Avatar is size="sm" (w-8, 32px), center is at 16px (w-4).
  // Parent text starts at 44px (w-8 + gap-3 = 32 + 12).
  // ml-4 (16px) puts the left border exactly under the parent's avatar center.
  // pl-6 sm:pl-7 (24px to 28px) makes the child avatar start at 16 + 1 + 28 = 45px, which perfectly aligns with the parent text!
  const indentClass = depth === 1 ? "" : "ml-4 pl-6 sm:pl-7 mt-3";

  const handleEditSave = (newContent: string) => {
    onEditSave(comment.id, newContent);
    setIsEditing(false);
  };

  const formattedDate = () => {
    try {
      // In the design, it shows relative time like "2 hours ago".
      // For simplicity, we keep the original formatter or a short relative format.
      // We will just use the current simple formatter here to keep logic intact.
      return new Date(comment.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Just now";
    }
  };

  const initialLetter = comment.username ? comment.username.slice(0, 2).toUpperCase() : "AN";

  // Renders the core comment details (User Row, Text Content, actions footer bar)
  // Shared across both root triggers, and nested Disclosure trigger rows
  const renderCommentContentOnly = () => {
    return (
      <div className="group relative flex w-full gap-3">
        <div
          className="flex shrink-0 flex-col items-center"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <HoverCard openDelay={300} closeDelay={150}>
            <HoverCard.Trigger>
              <Avatar size="sm">
                {comment.avatar ? (
                  <Avatar.Image src={comment.avatar} alt={comment.username} />
                ) : (
                  <Avatar.Fallback>{initialLetter}</Avatar.Fallback>
                )}
              </Avatar>
            </HoverCard.Trigger>
            <HoverCard.Content>
              <HoverCard.Arrow />
              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  <Avatar.Fallback>{initialLetter}</Avatar.Fallback>
                </Avatar>
                <div className="flex flex-col items-start justify-center text-left">
                  <span className="text-sm leading-4 font-semibold">
                    {comment.nickname || comment.username || "Anonymous"}
                  </span>
                  <span className="text-muted text-xs">@{comment.username}</span>
                </div>
              </div>
              <p className="text-foreground/80 mt-3 pl-px text-left text-xs leading-relaxed">
                A wandering traveler exploring the Odyssey cyber sanctuary. Actively participating
                in the dialogue stream with constructive insights.
              </p>
              <div className="text-muted mt-3 flex gap-4 text-xs">
                <div className="flex gap-1">
                  <p className="text-foreground font-semibold">12</p>
                  <p>Contributions</p>
                </div>
                <div className="flex gap-1">
                  <p className="text-foreground font-semibold">4</p>
                  <p>Resonances</p>
                </div>
              </div>
            </HoverCard.Content>
          </HoverCard>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <Typography type="h6" weight="bold">
                {comment.nickname || comment.username || "Anonymous"}
              </Typography>

              <Typography type="body-xs" color="muted">
                {formattedDate()}
              </Typography>

              {comment.isFailed && (
                <Chip size="sm" variant="soft" color="danger">
                  Failed to send
                </Chip>
              )}

              {comment.status === "PENDING" && !comment.isPending && (
                <Chip size="sm" variant="soft" color="warning">
                  Awaiting Moderation
                </Chip>
              )}
            </div>

            {/* Badges / Indication info */}
            <div
              className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Dropdown>
                <Button size="sm" variant="ghost" isIconOnly aria-label="Copy comment link">
                  <Icon icon="lucide:more-horizontal" className="size-3.5" />
                </Button>
                <Dropdown.Popover>
                  <Dropdown.Menu onAction={() => {}}>
                    <Dropdown.Item id="copy" textValue="Copy Link">
                      <div className="flex items-center gap-2">
                        <Icon icon="lucide:link" className="size-3.5" />
                        <span className="text-xs">Copy Link</span>
                      </div>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
          </div>

          {/* Comment content */}
          <div className="mt-0.5 text-left">
            <CommentContent
              content={comment.content}
              isEditing={isEditing}
              onEditSave={handleEditSave}
              onEditCancel={() => setIsEditing(false)}
              isReported={comment.isReported}
              isEdited={comment.isEdited}
            />
          </div>

          {/* Comment actions footer bar */}
          {!isEditing && (
            <div
              className="mt-1.5 mb-1 flex items-center justify-between"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <CommentActions
                  comment={comment}
                  depth={depth}
                  isReplying={isReplying}
                  onLikeToggle={() => onLikeToggle(comment.id, comment.isLiked, comment.likesCount)}
                  onReplyToggle={() => {
                    if (!isAuthenticated) {
                      dispatch(setLoginOpen(true));
                      return;
                    }
                    const nextReplying = !isReplying;
                    setActiveReplyId(nextReplying ? comment.id : null);
                    if (nextReplying) {
                      setIsExpanded(true);
                    }
                  }}
                  onEditStart={() => setIsEditing(true)}
                  onDelete={() => onDelete(comment.id)}
                  onReport={() => onReport(comment.id)}
                />

                {comment.isFailed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => onRetry(comment.id, comment.content, comment.parentId)}
                  >
                    <Icon icon="lucide:refresh-cw" className="mr-1.5 size-3" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReplyFormAndChildren = () => {
    return (
      <>
        <AnimatePresence initial={false}>
          {isReplying && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
              className="mt-1 flex w-full flex-col gap-2 overflow-hidden pt-1 pr-1 pl-11"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <CommentInput
                replyId={comment.id}
                placeholder={`Reply to @${comment.nickname || comment.username}...`}
                submitButtonText="Publish Reply"
                onCancel={() => setActiveReplyId(null)}
                onSubmit={(content) => onReplySubmit(content, comment.id)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {comment.children && comment.children.length > 0 && (
          <div className="flex flex-col">
            {comment.children.map((child) => (
              <CommentItem
                key={child.id}
                comment={child}
                depth={depth + 1}
                onLikeToggle={onLikeToggle}
                onReplySubmit={onReplySubmit}
                onEditSave={onEditSave}
                onDelete={onDelete}
                onReport={onReport}
                onRetry={onRetry}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  // 🚪 BRANCHING LOGIC FOR IMMERSIVE NESTING LAYOUT:

  const hasChildren = comment.children && comment.children.length > 0;

  return (
    <div
      id={`comment-card-${comment.id}`}
      className={cn(
        "transition-[background-color,box-shadow] duration-200 ease-out",
        depth === 1 ? "w-full" : "w-auto",
        depth === 1 &&
          isHighlighted &&
          "bg-accent-soft/10 ring-accent/30 rounded-2xl p-4 shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)] ring-1",
        depth > 1 && indentClass
      )}
    >
      <Card variant="secondary">
        <div
          className={cn(hasChildren && "cursor-pointer transition-colors")}
          role={hasChildren ? "button" : undefined}
          tabIndex={hasChildren ? 0 : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
          onClick={() => {
            if (hasChildren) {
              setIsExpanded(!isExpanded);
            }
          }}
          onKeyDown={(e) => {
            if (!hasChildren || (e.key !== "Enter" && e.key !== " ")) return;
            e.preventDefault();
            setIsExpanded((expanded) => !expanded);
          }}
        >
          {renderCommentContentOnly()}
        </div>

        <AnimatePresence initial={false}>
          {(isExpanded || !hasChildren) && (
            <motion.div
              initial={hasChildren ? { height: 0, opacity: 0 } : undefined}
              animate={hasChildren ? { height: "auto", opacity: 1 } : undefined}
              exit={hasChildren ? { height: 0, opacity: 0 } : undefined}
              transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
              className="overflow-hidden"
            >
              {renderReplyFormAndChildren()}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
