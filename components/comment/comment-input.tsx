"use client";

import { Icon } from "@iconify/react";

import {
  Button,
  Description,
  Form,
  Label,
  Modal,
  TextArea,
  TextField,
  Typography,
} from "@heroui/react";
import { PromptInput, PromptSuggestion } from "@heroui-pro/react";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { selectUserEmail } from "@/lib/features/auth";
import { setLoginOpen } from "@/lib/features/ui";
import { useGetCurrentUserQuery } from "@/lib/features/user";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { commentDebug } from "@/lib/comment-debug";
import { useCommentContext } from "./context/comment-context";
import { useCommentDraft } from "./hooks/use-comment-draft";

interface CommentInputProps {
  replyId?: number | null;
  replyTo?: string;
  isOpen?: boolean;
  hideTrigger?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onAuthenticationRequired?: () => void;
  onSubmit: (content: string) => Promise<boolean>;
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
  const { postId, momentId, isGuestbook, isMoment, isAuthenticated, currentUser } =
    useCommentContext();
  const email = useAppSelector(selectUserEmail);
  const { data: currentUserProfile } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });
  const draftThreadKey = isGuestbook
    ? "guestbook"
    : isMoment
      ? `moment:${momentId}`
      : `post:${postId}`;
  const [content, setDraft, clearDraft] = useCommentDraft(draftThreadKey, replyId);
  const draftScope = `${draftThreadKey}:${replyId ?? "root"}`;
  const [internalOpen, setInternalOpen] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<{ scope: string } | null>(null);
  const activeSubmission = useRef<{ scope: string } | null>(null);
  const isSubmitting = pendingSubmission?.scope === draftScope;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useAppDispatch();
  const formId = useId();
  const modalIsOpen = isOpen ?? internalOpen;
  const isReply = replyId !== null;
  const composerName = currentUser || "Anonymous";

  useEffect(() => {
    return () => {
      // A previous thread's request may finish, but must not close this composer.
      activeSubmission.current = null;
    };
  }, [draftScope]);

  const setModalOpen = (nextIsOpen: boolean) => {
    if (isOpen === undefined) setInternalOpen(nextIsOpen);
    onOpenChange?.(nextIsOpen);
  };

  const openComposer = () => {
    setModalOpen(true);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);
  };

  const submitComment = async () => {
    commentDebug("input:submit-called", {
      replyId,
      isAuthenticated,
      hasContent: Boolean(content.trim()),
      isSubmitting,
    });

    if (!isAuthenticated) {
      setModalOpen(false);
      onAuthenticationRequired?.();
      dispatch(setLoginOpen(true));
      return;
    }

    if (!content.trim() || isSubmitting || activeSubmission.current?.scope === draftScope) return;

    const submission = { scope: draftScope };
    activeSubmission.current = submission;
    setPendingSubmission(submission);
    commentDebug("input:submit-start", { replyId, contentLength: content.trim().length });
    try {
      const submitted = await onSubmit(content.trim());
      if (!submitted) {
        commentDebug("input:submit-not-accepted", { replyId });
        return;
      }
      commentDebug("input:submit-resolved", { replyId });
      if (clearDraft(content) && activeSubmission.current === submission) {
        setModalOpen(false);
      }
    } catch (error) {
      commentDebug("input:submit-rejected", {
        replyId,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error("Comment submission failed:", error);
    } finally {
      if (activeSubmission.current === submission) activeSubmission.current = null;
      setPendingSubmission((current) => (current === submission ? null : current));
      commentDebug("input:submit-finally", { replyId });
    }
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitComment();
  };

  const handleValueChange = (value: string) => {
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
      <PromptInput
        layout="inline"
        maxHeight={140}
        size="md"
        value={content}
        variant="secondary"
        onSubmit={() => void submitComment()}
        onValueChange={handleValueChange}
      >
        <PromptInput.Shell className="border-border/80 rounded-xl">
          <PromptInput.Content>
            <PromptInput.TextArea
              ref={textareaRef}
              aria-label="Add a comment"
              maxLength={1000}
              placeholder="Write a comment…"
            />
          </PromptInput.Content>
          <PromptInput.Toolbar>
            <PromptInput.ToolbarStart>
              <UserAvatar
                size="sm"
                variant="soft"
                className="shrink-0"
                name={composerName}
                avatar={currentUserProfile?.avatar}
                email={email}
              />
            </PromptInput.ToolbarStart>
            <PromptInput.ToolbarEnd>
              <PromptInput.Send
                aria-label="Send comment"
                status={isSubmitting ? "submitted" : "ready"}
              >
                <Icon icon="gravity-ui:arrow-up" aria-hidden="true" className="size-4" />
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
    );
  }

  if (isReply && hideTrigger) {
    return (
      <div className="border-border/80 bg-surface/40 mt-3 rounded-xl border p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Typography color="muted" type="body-xs">
            Replying to <span className="text-foreground font-medium">{replyTo}</span>
          </Typography>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="text-muted size-7"
            aria-label="Cancel reply"
            onPress={() => onOpenChange?.(false)}
          >
            <Icon icon="gravity-ui:xmark" aria-hidden="true" className="size-3.5" />
          </Button>
        </div>

        <Form id={formId} className="flex flex-col gap-2.5" onSubmit={handleFormSubmit}>
          <TextField isRequired fullWidth name="reply">
            <Label className="sr-only">Reply content</Label>
            <TextArea
              autoFocus
              aria-label={heading}
              fullWidth
              maxLength={1000}
              placeholder={placeholder}
              rows={3}
              ref={textareaRef}
              value={content}
              variant="secondary"
              onChange={handleChange}
            />
          </TextField>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted text-[11px] tabular-nums">{content.length}/1000</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                isDisabled={isSubmitting}
                onPress={() => onOpenChange?.(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="h-8"
                type="submit"
                isDisabled={!content.trim() || isSubmitting}
                isPending={isSubmitting}
              >
                {submitButtonText}
              </Button>
            </div>
          </div>
        </Form>
      </div>
    );
  }

  return (
    <>
      {!hideTrigger && (
        <Button fullWidth variant="secondary" onPress={openComposer}>
          <UserAvatar
            size="sm"
            variant="soft"
            className="shrink-0"
            name={composerName}
            avatar={currentUserProfile?.avatar}
            email={email}
          />
          <Typography color="muted" type="body-sm" align="start">
            Write a comment...
          </Typography>
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
                    ref={textareaRef}
                    value={content}
                    variant="secondary"
                    onChange={handleChange}
                  />
                  <Description>{content.length}/1000</Description>
                </TextField>
              </Form>

              <PromptSuggestion className="gap-3">
                <PromptSuggestion.Header>
                  <PromptSuggestion.Description>Suggestions</PromptSuggestion.Description>
                </PromptSuggestion.Header>
                <PromptSuggestion.Items className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {COMMENT_SUGGESTIONS.map((suggestion) => (
                    <PromptSuggestion.Item
                      key={suggestion}
                      onPress={() => applySuggestion(suggestion)}
                    >
                      {suggestion}
                    </PromptSuggestion.Item>
                  ))}
                </PromptSuggestion.Items>
              </PromptSuggestion>
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
