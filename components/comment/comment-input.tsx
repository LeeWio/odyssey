"use client";

import { ArrowUp, Paperclip } from "@gravity-ui/icons";
import { Icon } from "@iconify/react";

import {
  Accordion,
  Button,
  Description,
  Form,
  Input,
  Label,
  Modal,
  Switch,
  TextArea,
  TextField,
  Typography,
} from "@heroui/react";
import {
  ChatAttachment,
  ChatAttachmentGroup,
  ChatAttachmentInput,
  PromptInput,
  PromptSuggestion,
} from "@heroui-pro/react";
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
import type { GuestCommentIdentity } from "./hooks/use-comment-mutations";

interface CommentInputProps {
  replyId?: number | null;
  replyTo?: string;
  isOpen?: boolean;
  hideTrigger?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onAuthenticationRequired?: () => void;
  onSubmit: (content: string, guest?: GuestCommentIdentity) => Promise<boolean>;
  placeholder?: string;
  submitButtonText?: string;
}

const COMMENT_SUGGESTION_KEYS = [
  "suggestionHighlight",
  "suggestionQuestion",
  "suggestionAngle",
  "suggestionNote",
] as const;

const GUEST_NAME_STORAGE_KEY = "odyssey:comment-guest-name";

type PendingAttachment = {
  id: string;
  mimeType?: string;
  name: string;
  src?: string;
};

function readStoredGuestName() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(GUEST_NAME_STORAGE_KEY) ?? "";
}

function createAttachmentId(file: File) {
  return `${file.name}-${file.lastModified}-${
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  }`;
}

function revokeAttachmentUrl(attachment: PendingAttachment) {
  if (attachment.src?.startsWith("blob:")) URL.revokeObjectURL(attachment.src);
}

function CommentAttachmentPreviews({
  attachments,
  onRemove,
  removeLabel,
}: {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
  removeLabel: string;
}) {
  if (!attachments.length) return null;

  return (
    <PromptInput.Attachments>
      <ChatAttachmentGroup>
        {attachments.map((file) => (
          <ChatAttachment key={file.id} mimeType={file.mimeType} name={file.name} src={file.src}>
            <ChatAttachment.Preview />
            <ChatAttachment.Remove aria-label={removeLabel} onPress={() => onRemove(file.id)} />
          </ChatAttachment>
        ))}
      </ChatAttachmentGroup>
    </PromptInput.Attachments>
  );
}

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
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const attachmentsRef = useRef<PendingAttachment[]>([]);
  const [postAsGuest, setPostAsGuest] = useState(false);
  const [guestName, setGuestName] = useState(readStoredGuestName);
  const [guestEmail, setGuestEmail] = useState("");
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
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      // A previous thread's request may finish, but must not close this composer.
      activeSubmission.current = null;
      setAttachments((current) => {
        current.forEach(revokeAttachmentUrl);
        return [];
      });
    };
  }, [draftScope]);

  const clearAttachments = () => {
    setAttachments((current) => {
      current.forEach(revokeAttachmentUrl);
      return [];
    });
  };

  const handleFilesSelected = (files: File[]) => {
    setAttachments((current) => [
      ...current,
      ...files.map((file) => ({
        id: createAttachmentId(file),
        mimeType: file.type,
        name: file.name,
        src: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      })),
    ]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => {
      const removed = current.find((attachment) => attachment.id === id);
      if (removed) revokeAttachmentUrl(removed);
      return current.filter((attachment) => attachment.id !== id);
    });
  };

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

    if (postAsGuest && !guestName.trim()) {
      return;
    }
    if (!postAsGuest && !isAuthenticated) {
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
      const guest = postAsGuest
        ? { guestName: guestName.trim(), guestEmail: guestEmail.trim() || undefined }
        : undefined;
      if (guest) {
        window.localStorage.setItem(GUEST_NAME_STORAGE_KEY, guest.guestName);
      }
      const submitted = await onSubmit(content.trim(), guest);
      if (!submitted) {
        commentDebug("input:submit-not-accepted", { replyId });
        return;
      }
      commentDebug("input:submit-resolved", { replyId });
      if (clearDraft(content) && activeSubmission.current === submission) {
        clearAttachments();
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
  const canSubmit = Boolean(content.trim()) && (!postAsGuest || Boolean(guestName.trim()));

  const guestSwitch = (
    <Switch
      aria-label={t("postAsGuest")}
      isSelected={postAsGuest}
      size="sm"
      onChange={setPostAsGuest}
    >
      <Switch.Content>
        <Label className="text-xs">{t("postAsGuest")}</Label>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );

  const guestFields = (
    <Accordion expandedKeys={postAsGuest ? ["guest"] : []}>
      <Accordion.Item id="guest">
        <Accordion.Heading className="sr-only">
          <Accordion.Trigger>{t("postAsGuest")}</Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body className="flex flex-col gap-3 px-0">
            <TextField isRequired name="guestName" value={guestName} onChange={setGuestName}>
              <Label>{t("guestName")}</Label>
              <Input maxLength={32} placeholder={t("guestNamePlaceholder")} variant="secondary" />
            </TextField>
            <TextField name="guestEmail" type="email" value={guestEmail} onChange={setGuestEmail}>
              <Label>{t("guestEmail")}</Label>
              <Input
                maxLength={120}
                placeholder={t("guestEmailPlaceholder")}
                type="email"
                variant="secondary"
              />
              <Description>{t("guestEmailHint")}</Description>
            </TextField>
          </Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );

  if (!isReply && !hideTrigger) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Typography color="muted" type="body-sm">
            {t("writeCommentTrigger")}
          </Typography>
          {guestSwitch}
        </div>
        {guestFields}
        <PromptInput
          layout="compact"
          status={isSubmitting ? "submitted" : "ready"}
          value={content}
          onSubmit={() => {
            if (!canSubmit) {
              if (!postAsGuest && !isAuthenticated) {
                onAuthenticationRequired?.();
                dispatch(setLoginOpen(true));
              }
              return;
            }
            void submitComment();
          }}
          onValueChange={handleValueChange}
        >
          <ChatAttachmentInput onFilesSelected={handleFilesSelected}>
            <ChatAttachmentInput.Dropzone
              render={(dropzoneProps) => (
                <PromptInput.Shell {...dropzoneProps}>
                  <PromptInput.Content>
                    <CommentAttachmentPreviews
                      attachments={attachments}
                      removeLabel={t("removeAttachment")}
                      onRemove={removeAttachment}
                    />
                    <PromptInput.TextArea
                      ref={textareaRef}
                      aria-label={t("addComment")}
                      className="[backdrop-filter:none] [-webkit-backdrop-filter:none]"
                      maxLength={1000}
                      placeholder={t("writePlaceholder")}
                    />
                  </PromptInput.Content>
                  <PromptInput.Toolbar>
                    <PromptInput.ToolbarStart>
                      <ChatAttachmentInput.Trigger
                        render={(triggerProps) => (
                          <PromptInput.Action
                            {...triggerProps}
                            aria-label={t("attachFile")}
                            tooltip={t("attachFile")}
                          >
                            <Paperclip className="size-4" />
                          </PromptInput.Action>
                        )}
                      />
                    </PromptInput.ToolbarStart>
                    <PromptInput.ToolbarEnd>
                      <PromptInput.Send aria-label={t("sendComment")}>
                        <ArrowUp className="size-4" />
                      </PromptInput.Send>
                    </PromptInput.ToolbarEnd>
                  </PromptInput.Toolbar>
                </PromptInput.Shell>
              )}
            />
          </ChatAttachmentInput>
          {/* <PromptInput.Footer>
            {content.length > 0 ? t("characterCount", { count: content.length }) : t("sendHint")}
          </PromptInput.Footer> */}
        </PromptInput>
      </div>
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
            aria-label={t("cancelReply")}
            onPress={() => onOpenChange?.(false)}
          >
            <Icon icon="gravity-ui:xmark" aria-hidden="true" className="size-3.5" />
          </Button>
        </div>

        <Form id={formId} className="flex flex-col gap-2.5" onSubmit={handleFormSubmit}>
          <div className="flex justify-end">{guestSwitch}</div>
          {guestFields}
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
                isDisabled={isSubmitting}
                onPress={() => onOpenChange?.(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                size="sm"
                variant="primary"
                type="submit"
                isDisabled={!canSubmit || isSubmitting}
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
        <div className="flex items-center gap-3">
          <Button fullWidth variant="secondary" onPress={openComposer}>
            <UserAvatar
              size="sm"
              variant="soft"
              className="shrink-0"
              name={postAsGuest ? guestName || t("anonymous") : composerName}
              avatar={postAsGuest ? undefined : currentUserProfile?.avatar}
              email={postAsGuest ? undefined : email}
            />
            <Typography color="muted" type="body-sm" align="start" className="truncate">
              {t("writeCommentTrigger")}
            </Typography>
          </Button>
          {guestSwitch}
        </div>
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
                {guestFields}
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
                isDisabled={!canSubmit || isSubmitting}
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
