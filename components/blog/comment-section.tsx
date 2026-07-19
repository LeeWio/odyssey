"use client";

import React, { useState } from "react";
import { Button, Card, TextArea, TextField, Spinner, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import {
  useGetPostCommentsQuery,
  usePublishCommentMutation,
} from "@/lib/features/comment/comment-api";
import { CommentCard } from "./comment-card";

interface CommentSectionProps {
  postId: number;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [commentContent, setCommentContent] = useState("");
  const [page, setPage] = useState(0);
  const size = 15; // standard thread sizing

  // Query hierarchical comments for this post ID
  const {
    data: commentPage,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useGetPostCommentsQuery({
    postId,
    page,
    size,
  });

  const [publishComment, { isLoading: isSubmitting }] = usePublishCommentMutation();

  const handleRootCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      await publishComment({
        postId,
        content: commentContent.trim(),
      }).unwrap();

      setCommentContent("");
      refetch(); // force refresh
    } catch (err) {
      console.error("Failed to publish top-level comment:", err);
    }
  };

  const comments = commentPage?.list || [];
  const totalPages = commentPage?.totalPages || 1;

  return (
    <div className="border-default-100/50 mt-16 flex flex-col gap-8 border-t pt-12">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Icon icon="lucide:message-square" className="text-accent size-5" />
          <Typography type="h3" className="text-xl font-bold tracking-tight">
            Symbiosis Echoes
          </Typography>
          <span className="bg-default-100 text-default-600 rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold">
            {commentPage?.total || 0}
          </span>
        </div>

        {/* Sync status indicator */}
        {isFetching && !isLoading && (
          <div className="flex items-center gap-1.5 opacity-60">
            <Spinner size="sm" color="accent" />
            <span className="text-default-400 text-[10px] font-semibold">Syncing thread...</span>
          </div>
        )}
      </div>

      {/* Root Comment Submission Form */}
      <form onSubmit={handleRootCommentSubmit} className="flex flex-col gap-3">
        <TextField isRequired name="comment">
          <TextArea
            placeholder="Share your resonance. Join the dialogue with constructive insights..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            variant="secondary"
            className="w-full resize-none text-sm"
            maxLength={1000}
          />
        </TextField>
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="primary"
            type="submit"
            isDisabled={!commentContent.trim() || isSubmitting}
            className="rounded-full font-semibold"
          >
            {isSubmitting ? (
              <Spinner size="sm" color="accent" className="mr-1.5" />
            ) : (
              <Icon icon="lucide:send" className="mr-1.5 size-3.5" />
            )}
            Publish Narrative
          </Button>
        </div>
      </form>

      {/* Comment List */}
      {isLoading ? (
        <div className="flex flex-col gap-4 py-8">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card
              key={idx}
              className="bg-default-50/20 border-default-100 relative h-32 animate-pulse rounded-2xl border p-4"
            >
              <div className="flex gap-3">
                <div className="bg-default-200 size-8 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="bg-default-200 h-4 w-24 rounded-full" />
                  <div className="bg-default-200 h-3 w-40 rounded-full" />
                </div>
              </div>
              <div className="bg-default-200 mt-4 ml-11 h-4 w-5/6 rounded-full" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-danger/20 bg-danger-soft/10 flex flex-col items-center justify-center border border-dashed py-10 text-center">
          <Icon icon="lucide:alert-circle" className="text-danger size-8" />
          <Typography type="body-sm" className="text-danger mt-3 font-semibold">
            Unable to fetch dialog feed.
          </Typography>
          <Button size="sm" variant="ghost" onPress={() => refetch()} className="mt-4">
            Retry Sync
          </Button>
        </Card>
      ) : comments.length === 0 ? (
        <Card className="border-default-100 flex flex-col items-center justify-center border border-dashed py-12 text-center opacity-80">
          <Icon icon="lucide:messages-square" className="text-default-300 size-10" />
          <Typography type="body-sm" color="muted" className="mt-3 font-medium">
            Silent frequency. Be the first to express a resonance.
          </Typography>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              postId={postId}
              depth={1}
              onCommentPublished={refetch}
            />
          ))}

          {/* Comment Section Pagination */}
          {totalPages > 1 && (
            <div className="border-default-100/50 mt-4 flex items-center justify-between border-t pt-4">
              <Button
                size="sm"
                variant="ghost"
                isDisabled={page === 0}
                onPress={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-full"
              >
                <Icon icon="lucide:chevron-left" className="mr-1 size-3.5" />
                Older
              </Button>
              <div className="text-default-400 font-mono text-[10px] select-none">
                Thread page {page + 1} of {totalPages}
              </div>
              <Button
                size="sm"
                variant="ghost"
                isDisabled={page >= totalPages - 1}
                onPress={() => setPage((p) => p + 1)}
                className="rounded-full"
              >
                Newer
                <Icon icon="lucide:chevron-right" className="ml-1 size-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
