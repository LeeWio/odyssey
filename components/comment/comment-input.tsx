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
import { useTranslations } from "next-intl";
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

const COMMENT_SUGGESTION_KEYS = [
  "suggestionHighlight",
  "suggestionQuestion",
  "suggestionAngle",
  "suggestionNote",
] as const;

export function CommentInput({
  replyId = null,
  replyTo,
  isOpen,
  hideTrigger = false,
  onOpenChange,
  onAuthenticationRequired,
  onSubmit,
  placeholder,
  submitButtonText,
}: CommentInputProps) {
  const t = useTranslations("Comments");
  const resolvedPlaceholder = placeholder ?? t("shareThoughts");
  const resolvedSubmit = submitButtonText ?? t("postComment");
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
  const composerName = currentUser || t("anonymous");

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

  const heading = isReply && replyTo ? t("replyTo", { name: replyTo }) : t("writeComment");
  const description = isReply ? t("replyDescription") : t("writeDescription");

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
              aria-label={t("addComment")}
              maxLength={1000}
              placeholder={t("writePlaceholder")}
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
                aria-label={t("sendComment")}
                status={isSubmitting ? "submitted" : "ready"}
              >
                <Icon icon="gravity-ui:arrow-up" aria-hidden="true" className="size-4" />
              </PromptInput.Send>
            </PromptInput.ToolbarEnd>
          </PromptInput.Toolbar>
        </PromptInput.Shell>
        <PromptInput.Footer className="sr-only" aria-live="polite">
          {content.length > 0 ? t("characterCount", { count: content.length }) : t("sendHint")}
        </PromptInput.Footer>
      </PromptInput>
    );
  }

  if (isReply && hideTrigger) {
    return (
      <div className="border-border/80 bg-surface/40 mt-3 rounded-xl border p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Typography color="muted" type="body-xs">
            {t("replyingTo")} <span className="text-foreground font-medium">{replyTo}</span>
          </Typography>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="text-muted size-7"
            aria-label={t("cancelReply")}
            onPress={() => onOpenChange?.(false)}
          >
            <Icon icon="gravity-ui:xmark" aria-hidden="true" className="size-3.5" />
          </Button>
        </div>

        <Form id={formId} className="flex flex-col gap-2.5" onSubmit={handleFormSubmit}>
          <TextField isRequired fullWidth name="reply">
            <Label className="sr-only">{t("replyContent")}</Label>
            <TextArea
              autoFocus
              aria-label={heading}
              fullWidth
              maxLength={1000}
              placeholder={resolvedPlaceholder}
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
                {t("cancel")}
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="h-8"
                type="submit"
                isDisabled={!content.trim() || isSubmitting}
                isPending={isSubmitting}
              >
                {resolvedSubmit}
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
            {t("writeCommentTrigger")}
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
                    placeholder={resolvedPlaceholder}
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
                  <PromptSuggestion.Description>{t("suggestions")}</PromptSuggestion.Description>
                </PromptSuggestion.Header>
                <PromptSuggestion.Items className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {COMMENT_SUGGESTION_KEYS.map((key) => (
                    <PromptSuggestion.Item key={key} onPress={() => applySuggestion(t(key))}>
                      {t(key)}
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
                {t("cancel")}
              </Button>
              <Button
                form={formId}
                type="submit"
                variant="primary"
                isDisabled={!content.trim() || isSubmitting}
                isPending={isSubmitting}
              >
                {resolvedSubmit}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
