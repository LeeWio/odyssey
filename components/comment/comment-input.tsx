"use client";

import React, { useState, useEffect } from "react";
import { Button, TextArea, TextField, Spinner, Avatar, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useCommentContext } from "./context/comment-context";
import { useCommentDraft } from "./hooks/use-comment-draft";
import { useAppDispatch } from "@/lib/hooks";
import { setLoginOpen } from "@/lib/features/auth";

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
  const dispatch = useAppDispatch();

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
    if (!isAuthenticated) {
      dispatch(setLoginOpen(true));
      return;
    }
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

  const initialLetter = currentUser ? currentUser.slice(0, 2).toUpperCase() : "AN";

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
      {replyId === null && (
        <Avatar size="sm">
          <Avatar.Fallback>{initialLetter}</Avatar.Fallback>
        </Avatar>
      )}

      <TextField isRequired name="comment">
        <TextArea
          placeholder={placeholder}
          value={content}
          onChange={handleChange}
          onFocus={() => {
            if (!isAuthenticated) {
              dispatch(setLoginOpen(true));
            }
          }}
          variant="secondary"
          maxLength={1000}
          rows={replyId ? 2 : 3}
        />
      </TextField>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button size="sm" variant="ghost" onPress={onCancel} isDisabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button
          size="sm"
          variant="primary"
          type="submit"
          isDisabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? <Spinner size="sm" color="accent" /> : <Icon icon="lucide:send" />}
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
}
