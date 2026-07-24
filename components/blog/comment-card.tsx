"use client";

import {
  Avatar,
  Button,
  Card,
  Chip,
  cn,
  Spinner,
  TextArea,
  TextField,
  Tooltip,
  Typography,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type React from "react";
import { useState } from "react";
import {
  type CommentResponse,
  usePublishCommentMutation,
} from "@/lib/features/comment/comment-api";

interface CommentCardProps {
  comment: CommentResponse;
  postId: number;
  depth?: number;
  onCommentPublished?: () => void;
}

export function CommentCard({ comment, postId, depth = 1, onCommentPublished }: CommentCardProps) {
  const [isReplying, setIsPlaying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const [publishComment, { isLoading: isSubmitting }] = usePublishCommentMutation();

  const handleLike = () => {
    setIsLiked((prev) => {
      setLikesCount((count) => (prev ? count - 1 : count + 1));
      return !prev;
    });
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await publishComment({
        postId,
        parentId: comment.id,
        content: replyContent.trim(),
      }).unwrap();

      setReplyContent("");
      setIsPlaying(false);
      if (onCommentPublished) {
        onCommentPublished();
      }
    } catch (err) {
      console.error("Failed to publish reply comment:", err);
    }
  };

  // Indentation logic up to max 3 levels to avoid nesting squish on small devices
  const indentClass =
    depth === 1
      ? ""
      : depth === 2
        ? "ml-4 sm:ml-8 pl-3 border-l-2 border-default-100/50"
        : "ml-3 sm:ml-6 pl-2.5 border-l-2 border-default-100/30";

  return (
    <div className={cn("flex w-full flex-col gap-4", indentClass)}>
      {/* Comment Body Card */}
      <Card
        variant="secondary"
        className={cn(
          "border-border/30 w-full border p-4 shadow-none transition-all duration-300",
          depth > 1 ? "bg-default-50/20" : "bg-default-50/50"
        )}
      >
        <div className="flex flex-col gap-3">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar size="sm" className="border-border/30 border">
                <Avatar.Fallback className="text-xs font-bold uppercase select-none">
                  {comment.username ? comment.username.slice(0, 2) : "AN"}
                </Avatar.Fallback>
              </Avatar>
              <div className="flex flex-col">
                <Typography type="body-xs" weight="semibold" className="text-foreground">
                  {comment.username || "Anonymous"}
                </Typography>
                <Typography type="body-xs" color="muted" className="mt-0.5 text-[10px]">
                  {new Date(comment.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </div>
            </div>

            {/* Nesting Level Badge for styling details */}
            {depth > 1 && (
              <Chip
                size="sm"
                variant="soft"
                className="h-5 px-1.5 text-[9px] font-semibold opacity-60"
              >
                Reply
              </Chip>
            )}
          </div>

          {/* Comment Message Text */}
          <Typography
            type="body-sm"
            className="text-foreground/90 pl-11 leading-relaxed whitespace-pre-wrap"
          >
            {comment.content}
          </Typography>

          {/* Actions Row (Likes and Replies) */}
          <div className="flex items-center gap-2 pl-11">
            {/* Upvote Button with Tooltip */}
            <Tooltip delay={0}>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={handleLike}
                aria-label="Upvote comment"
                className={cn(
                  "border-default-100/50 h-8 w-12 rounded-full border hover:bg-rose-500/10 hover:text-rose-500",
                  isLiked && "border-rose-500/20 bg-rose-500/10 text-rose-500"
                )}
              >
                <Icon
                  icon="lucide:heart"
                  className={cn("mr-1 size-3.5", isLiked && "fill-rose-500")}
                />
                <span className="font-mono text-[10px] font-semibold">{likesCount}</span>
              </Button>
              <Tooltip.Content>Like reply</Tooltip.Content>
            </Tooltip>

            {/* Reply Button (Only allowed if depth is less than 3) */}
            {depth < 3 && (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => setIsPlaying((p) => !p)}
                className="border-default-100/50 hover:bg-accent/10 hover:text-accent-600 h-8 rounded-full border"
              >
                <Icon icon="lucide:message-square" className="mr-1 size-3.5" />
                <span className="text-[10px] font-semibold">Reply</span>
              </Button>
            )}
          </div>
        </div>

        {/* Expandable Reply Sub-Form */}
        {isReplying && (
          <form
            onSubmit={handleReplySubmit}
            className="border-default-100/40 mt-4 flex flex-col gap-3 border-t pt-4 pl-11"
          >
            <TextField isRequired name="reply">
              <TextArea
                placeholder={`Write a reply to @${comment.username || "Anonymous"}...`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                variant="secondary"
                className="w-full resize-none text-sm"
                maxLength={500}
              />
            </TextField>
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  setReplyContent("");
                  setIsPlaying(false);
                }}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                type="submit"
                isDisabled={!replyContent.trim() || isSubmitting}
                className="rounded-full font-semibold"
              >
                {isSubmitting ? (
                  <Spinner size="sm" color="accent" className="mr-1.5" />
                ) : (
                  <Icon icon="lucide:send" className="mr-1.5 size-3.5" />
                )}
                Publish Reply
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Render children replies recursively */}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-1 flex w-full flex-col gap-4">
          {comment.children.map((child) => (
            <CommentCard
              key={child.id}
              comment={child}
              postId={postId}
              depth={depth + 1}
              onCommentPublished={onCommentPublished}
            />
          ))}
        </div>
      )}
    </div>
  );
}
