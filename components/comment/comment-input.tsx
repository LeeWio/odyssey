"use client";

import { Avatar, Button, Spinner, TextArea, TextField } from "@heroui/react";
import { Icon } from "@iconify/react";
import type React from "react";
import { useEffect, useState } from "react";
import { setLoginOpen } from "@/lib/features/auth";
import { useAppDispatch } from "@/lib/hooks";
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
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();

  // Initialize input content from draft
  useEffect(() => {
    const timer = setTimeout(() => {
      setContent(draft);
      setHasHydratedDraft(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [draft]);

  // Set context state for unsaved drafts
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasUnsavedDraft(hasHydratedDraft && content.trim().length > 0);
    }, 0);
    return () => clearTimeout(timer);
  }, [content, hasHydratedDraft, setHasUnsavedDraft]);

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
      setHasUnsavedDraft(false);
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

      <TextField isRequired fullWidth name="comment">
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
          fullWidth
          maxLength={1000}
          rows={replyId ? 2 : 3}
        />
      </TextField>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            size="sm"
            variant="ghost"
            onPress={() => {
              setContent("");
              clearDraft();
              setHasUnsavedDraft(false);
              onCancel();
            }}
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
        >
          {isSubmitting ? <Spinner size="sm" color="accent" /> : <Icon icon="lucide:send" />}
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
}
