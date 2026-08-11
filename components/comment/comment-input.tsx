"use client";

import { ArrowUp } from "@gravity-ui/icons";
import {
  Avatar,
  Button,
  Description,
  Form,
  Label,
  Modal,
  TextArea,
  TextField,
} from "@heroui/react";
import { PromptInput, PromptSuggestion } from "@heroui-pro/react";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch } from "@/lib/hooks";
import { useCommentContext } from "./context/comment-context";
import { useCommentDraft } from "./hooks/use-comment-draft";

interface CommentInputProps {
  replyId?: number | null;
  replyTo?: string;
  isOpen?: boolean;
  hideTrigger?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onAuthenticationRequired?: () => void;
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  submitButtonText?: string;
}

const COMMENT_SUGGESTIONS = [
  "Share a highlight ✦",
  "Ask a question 👋",
  "Add another angle ↗",
  "Leave a practical note ✓",
] as const;

export function CommentInput({
  replyId = null,
  replyTo,
  isOpen,
  hideTrigger = false,
  onOpenChange,
  onAuthenticationRequired,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const submitComment = async () => {
    if (!isAuthenticated) {
      setModalOpen(false);
      onAuthenticationRequired?.();
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

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitComment();
  };

  const handleValueChange = (value: string) => {
    setContent(value);
    setDraft(value);
  };

  const applySuggestion = (suggestion: string) => {
    handleValueChange(suggestion);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const heading = isReply && replyTo ? `Reply to ${replyTo}` : "Write a comment";
  const description = isReply
    ? "Continue the conversation with a clear and respectful reply."
    : "Add a thoughtful response to the discussion.";

  if (!isReply && !hideTrigger) {
    return (
      <div className="flex flex-col gap-4">
        <PromptInput
          layout="inline"
          maxHeight={160}
          size="lg"
          status={isSubmitting ? "submitted" : "ready"}
          value={content}
          variant="secondary"
          onSubmit={() => void submitComment()}
          onValueChange={handleValueChange}
        >
          <PromptInput.Shell>
            <PromptInput.Content>
              <PromptInput.TextArea
                ref={textareaRef}
                aria-label="Add a comment"
                maxLength={1000}
                placeholder="Add a comment"
              />
            </PromptInput.Content>
            <PromptInput.Toolbar>
              <PromptInput.ToolbarStart>
                <Avatar size="sm" variant="soft" className="shrink-0">
                  <Avatar.Fallback>{initialLetter}</Avatar.Fallback>
                </Avatar>
              </PromptInput.ToolbarStart>
              <PromptInput.ToolbarEnd>
                <PromptInput.Send aria-label="Send comment">
                  <ArrowUp aria-hidden="true" className="size-4" />
                </PromptInput.Send>
              </PromptInput.ToolbarEnd>
            </PromptInput.Toolbar>
          </PromptInput.Shell>
          <PromptInput.Footer className="sr-only" aria-live="polite">
            {content.length > 0
              ? `${content.length} of 1000 characters`
              : "Press Enter to send. Press Shift and Enter for a new line."}
          </PromptInput.Footer>
        </PromptInput>

        <PromptSuggestion className="gap-3">
          <PromptSuggestion.Header>
            <PromptSuggestion.Description>Suggestions</PromptSuggestion.Description>
          </PromptSuggestion.Header>
          <PromptSuggestion.Items className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {COMMENT_SUGGESTIONS.map((suggestion) => (
              <PromptSuggestion.Item key={suggestion} onPress={() => applySuggestion(suggestion)}>
                {suggestion}
              </PromptSuggestion.Item>
            ))}
          </PromptSuggestion.Items>
        </PromptSuggestion>
      </div>
    );
  }

  return (
    <>
      {!hideTrigger && (
        <Button fullWidth variant="secondary" onPress={openComposer}>
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
            </Modal.Header>

            <Modal.Body>
              <Form id={formId} className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
                <TextField isRequired fullWidth name={isReply ? "reply" : "comment"}>
                  <Label> {description}</Label>
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
                  <Description>{content.length}/1000</Description>
                </TextField>
              </Form>
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
