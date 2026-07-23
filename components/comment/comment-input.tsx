"use client";

import React, { useState, useEffect } from "react";
import { Button, TextArea, TextField, Spinner, Avatar, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useCommentContext } from "./context/comment-context";
import { useCommentDraft } from "./hooks/use-comment-draft";

interface CommentInputProps {
  replyId?: number | null;
  onCancel?: () => void;
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  submitButtonText?: string;
}

export function CommentInput({
  replyId = null,
  onCancel,
  onSubmit,
  placeholder = "Share your resonance. Join the dialogue with constructive insights...",
  submitButtonText = "Publish Narrative",
}: CommentInputProps) {
  const { postId, isAuthenticated, currentUser, setHasUnsavedDraft } = useCommentContext();
  const [draft, setDraft, clearDraft] = useCommentDraft(postId, replyId);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize input content from draft
  useEffect(() => {
    const timer = setTimeout(() => {
      setContent(draft);
    }, 0);
    return () => clearTimeout(timer);
  }, [draft]);

  // Set context state for unsaved drafts
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasUnsavedDraft(content.trim().length > 0 && content !== draft);
    }, 0);
    return () => clearTimeout(timer);
  }, [content, draft, setHasUnsavedDraft]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setDraft(val);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
      clearDraft();
    } catch (err) {
      console.error("Form submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="border-default-100/50 bg-default-50/20 flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center">
        <Icon icon="lucide:lock" className="text-default-400 mb-2 size-6" />
        <p className="text-default-600 text-sm font-semibold">Join the Resonance</p>
        <p className="text-default-400 mt-1 mb-4 text-xs">
          Please log in to express a perspective and join the discussion feed.
        </p>
        <Button
          size="sm"
          variant="primary"
          className="rounded-full font-semibold"
          onPress={() => {
            // Trigger login modal or navigation ( navbar controls login modal )
            const loginTrigger = document.querySelector(
              '[aria-label="User account menu"]'
            ) as HTMLElement;
            if (loginTrigger) {
              loginTrigger.click();
            } else {
              // Fallback: reload/navigate to login
              toast.warning("Please locate the Sign In button on the navigation bar.");
            }
          }}
        >
          <Icon icon="lucide:user" className="mr-1.5 size-3.5" />
          Sign In to Comment
        </Button>
      </div>
    );
  }

  const initialLetter = currentUser ? currentUser.slice(0, 2).toUpperCase() : "AN";

  return (
    <form onSubmit={handleFormSubmit} className="flex w-full gap-4">
      {replyId === null && (
        <Avatar size="sm" className="border-border/30 shrink-0 border">
          <Avatar.Fallback className="text-xs font-bold uppercase select-none">
            {initialLetter}
          </Avatar.Fallback>
        </Avatar>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <TextField isRequired name="comment" className="w-full">
          <TextArea
            placeholder={placeholder}
            value={content}
            onChange={handleChange}
            variant="secondary"
            className="w-full resize-none text-sm"
            maxLength={1000}
            rows={replyId ? 2 : 3}
          />
        </TextField>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full font-semibold transition-all duration-150 ease-out active:scale-[0.96]"
              onPress={onCancel}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            type="submit"
            isDisabled={!content.trim() || isSubmitting}
            className="rounded-full font-semibold transition-all duration-150 ease-out active:scale-[0.96]"
          >
            {isSubmitting ? (
              <Spinner size="sm" color="accent" className="mr-1.5" />
            ) : (
              <Icon icon="lucide:send" className="mr-1.5 size-3.5" />
            )}
            {submitButtonText}
          </Button>
        </div>
      </div>
    </form>
  );
}
