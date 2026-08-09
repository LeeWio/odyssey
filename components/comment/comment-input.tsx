"use client";

import { Avatar, Button, Modal, TextArea, TextField } from "@heroui/react";
import type React from "react";
import { useEffect, useId, useState } from "react";
import { setLoginOpen } from "@/lib/features/auth";
import { useAppDispatch } from "@/lib/hooks";
import { useCommentContext } from "./context/comment-context";
import { useCommentDraft } from "./hooks/use-comment-draft";

interface CommentInputProps {
  replyId?: number | null;
  replyTo?: string;
  isOpen?: boolean;
  hideTrigger?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  submitButtonText?: string;
}

export function CommentInput({
  replyId = null,
  replyTo,
  isOpen,
  hideTrigger = false,
  onOpenChange,
  onSubmit,
  placeholder = "Share your thoughts...",
  submitButtonText = "Post comment",
}: CommentInputProps) {
  const { postId, isAuthenticated, currentUser, setHasUnsavedDraft } = useCommentContext();
  const [draft, setDraft, clearDraft] = useCommentDraft(postId, replyId);
  const [content, setContent] = useState("");
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const formId = useId();
  const modalIsOpen = isOpen ?? internalOpen;
  const isReply = replyId !== null;
  const initialLetter = currentUser ? currentUser.slice(0, 2).toUpperCase() : "AN";

  useEffect(() => {
    const timer = setTimeout(() => {
      setContent(draft);
      setHasHydratedDraft(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasUnsavedDraft(hasHydratedDraft && content.trim().length > 0);
    }, 0);

    return () => clearTimeout(timer);
  }, [content, hasHydratedDraft, setHasUnsavedDraft]);

  const setModalOpen = (nextIsOpen: boolean) => {
    if (isOpen === undefined) setInternalOpen(nextIsOpen);
    onOpenChange?.(nextIsOpen);
  };

  const openComposer = () => {
    setModalOpen(true);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
    setDraft(event.target.value);
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setModalOpen(false);
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
      setModalOpen(false);
    } catch (error) {
      console.error("Comment submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const heading = isReply && replyTo ? `Reply to ${replyTo}` : "Write a comment";
  const description = isReply
    ? "Continue the conversation with a clear and respectful reply."
    : "Add a thoughtful response to the discussion.";

  return (
    <>
      {!hideTrigger && (
        <Button
          fullWidth
          variant="secondary"
          className="h-auto justify-start gap-3 px-3 py-3"
          onPress={openComposer}
        >
          <Avatar size="sm" variant="soft" className="shrink-0">
            <Avatar.Fallback>{initialLetter}</Avatar.Fallback>
          </Avatar>
          <span className="text-muted text-left text-sm">Write a comment...</span>
        </Button>
      )}

      <Modal.Backdrop isOpen={modalIsOpen} onOpenChange={setModalOpen}>
        <Modal.Container placement="auto" size="md">
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{heading}</Modal.Heading>
              <p className="text-muted mt-1.5 max-w-sm text-sm leading-5">{description}</p>
            </Modal.Header>

            <Modal.Body>
              <form id={formId} className="flex flex-col gap-2" onSubmit={handleFormSubmit}>
                <TextField isRequired fullWidth name={isReply ? "reply" : "comment"}>
                  <TextArea
                    autoFocus
                    aria-label={heading}
                    fullWidth
                    maxLength={1000}
                    placeholder={placeholder}
                    rows={7}
                    value={content}
                    variant="secondary"
                    onChange={handleChange}
                  />
                </TextField>
                <p className="text-muted text-right text-xs tabular-nums" aria-hidden="true">
                  {content.length}/1000
                </p>
              </form>
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="secondary"
                isDisabled={isSubmitting}
                onPress={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                form={formId}
                type="submit"
                variant="primary"
                isDisabled={!content.trim() || isSubmitting}
                isPending={isSubmitting}
              >
                {submitButtonText}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
