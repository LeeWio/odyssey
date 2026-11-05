"use client";

import { Button, Form, Sheet } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useCallback, useId, useMemo, useState } from "react";
import { CommentEditFields, CommentEditSession, useCommentEditSession } from "./comment-content";
import { CommentHeader } from "./comment-header";
import { CommentInput } from "./comment-input";
import { CommentSystem, type CommentSystemRenderParts } from "./comment-system";
import { useCommentContext } from "./context/comment-context";
import type { EnhancedComment } from "./types";
import { findCommentById } from "./utils/thread";

const NESTED_DIALOG_HEIGHT = "h-[320px] sm:h-[min(420px,70dvh)]";
const SHEET_CONTENT_SIZE = "mx-auto w-full max-h-[95dvh] sm:max-w-xl md:max-w-2xl lg:max-w-3xl";

interface CommentSheetProps {
  postId?: number;
  momentId?: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CommentSheet({ postId, momentId, isOpen, onOpenChange }: CommentSheetProps) {
  const handleRequestClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  const renderContent = useCallback(
    (parts: CommentSystemRenderParts) => <CommentSheetContent {...parts} />,
    []
  );

  return (
    <Sheet
      isOpen={isOpen}
      placement="bottom"
      snapPoints={["min(560px,72dvh)", "min(640px,78dvh)"]}
      onOpenChange={onOpenChange}
    >
      <Sheet.Backdrop isExiting variant="blur">
        <Sheet.Content className={SHEET_CONTENT_SIZE}>
          <Sheet.Dialog>
            <Sheet.Handle />
            <CommentSystem
              momentId={momentId}
              postId={postId}
              useNestedComposer
              onRequestClose={handleRequestClose}
            >
              {renderContent}
            </CommentSystem>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}

function CommentSheetContent({
  totalCount,
  isInitialCountLoading,
  newCount,
  isLoadingNew,
  onLoadNew,
  comments,
  commentList,
  publishComment,
  editComment,
}: CommentSystemRenderParts) {
  const t = useTranslations("Comments");
  const composerFormId = useId();
  const { editTarget, replyTarget, setActiveReplyId, setEditTarget, setReplyTarget } =
    useCommentContext();
  const editingComment = useMemo(
    () => (editTarget ? findCommentById(comments, editTarget.id) : null),
    [comments, editTarget]
  );
  const [composerOpen, setComposerOpen] = useState(false);
  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    setReplyTarget(null);
    setActiveReplyId(null);
  }, [setActiveReplyId, setReplyTarget]);

  return (
    <>
      <Sheet.Header>
        <CommentHeader
          inSheet
          isCountLoading={isInitialCountLoading}
          totalCount={totalCount}
          newCount={newCount}
          isLoadingNew={isLoadingNew}
          onLoadNew={onLoadNew}
        />
      </Sheet.Header>
      <Sheet.Body>{commentList}</Sheet.Body>
      <Sheet.Footer>
        <Sheet.NestedRoot
          isOpen={composerOpen || replyTarget !== null}
          onOpenChange={(open) => {
            setComposerOpen(open);
            if (!open) closeComposer();
          }}
        >
          <Sheet.Trigger>
            <Button fullWidth variant="secondary">
              {t("writeComment")}
            </Button>
          </Sheet.Trigger>
          <Sheet.Backdrop>
            <Sheet.Content className={SHEET_CONTENT_SIZE}>
              <Sheet.Dialog className={NESTED_DIALOG_HEIGHT}>
                <Sheet.Handle />
                <CommentInput
                  embedded
                  formId={composerFormId}
                  hideTrigger
                  isOpen
                  replyId={replyTarget?.id ?? null}
                  replyTo={replyTarget?.name}
                  placeholder={
                    replyTarget ? t("replyPlaceholder", { name: replyTarget.name }) : undefined
                  }
                  renderEmbedded={({ editor, signature, canSubmit, isSubmitting }) => (
                    <>
                      <Sheet.Header>{signature}</Sheet.Header>
                      <Sheet.Body>{editor}</Sheet.Body>
                      <Sheet.Footer>
                        <Sheet.Close>
                          <Button variant="secondary">{t("cancel")}</Button>
                        </Sheet.Close>
                        <Button
                          data-comment-composer-submit=""
                          isDisabled={!canSubmit || isSubmitting}
                          isPending={isSubmitting}
                          variant="secondary"
                          onPress={() => {
                            const form = document.getElementById(composerFormId);
                            if (form instanceof HTMLFormElement) form.requestSubmit();
                          }}
                        >
                          {replyTarget ? t("reply") : t("postComment")}
                        </Button>
                      </Sheet.Footer>
                    </>
                  )}
                  submitButtonText={replyTarget ? t("reply") : t("postComment")}
                  onOpenChange={(open) => {
                    if (!open) closeComposer();
                  }}
                  onSubmitted={closeComposer}
                  onSubmit={(content, guest) =>
                    publishComment(content, replyTarget?.id ?? null, guest)
                  }
                />
              </Sheet.Dialog>
            </Sheet.Content>
          </Sheet.Backdrop>
        </Sheet.NestedRoot>
      </Sheet.Footer>
      {editingComment ? (
        <CommentEditSheet
          comment={editingComment}
          onEditSave={editComment}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
      ) : null}
    </>
  );
}

function CommentEditSheet({
  comment,
  onEditSave,
  onOpenChange,
}: {
  comment: EnhancedComment;
  onEditSave: (id: number, content: string) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Comments");
  const formId = useId();

  return (
    <CommentEditSession
      content={comment.content}
      formId={formId}
      onEditCancel={() => onOpenChange(false)}
      onEditSave={(content) => onEditSave(comment.id, content)}
    >
      <Sheet.NestedRoot isOpen onOpenChange={onOpenChange}>
        <Sheet.Backdrop>
          <Sheet.Content className={SHEET_CONTENT_SIZE}>
            <Sheet.Dialog className={NESTED_DIALOG_HEIGHT}>
              <Sheet.Handle />
              <Sheet.Header>
                <Sheet.Heading>{t("editComment")}</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body>
                <CommentEditForm />
              </Sheet.Body>
              <CommentEditSheetFooter />
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet.NestedRoot>
    </CommentEditSession>
  );
}

function CommentEditForm() {
  const { formId, save } = useCommentEditSession();

  return (
    <Form
      id={formId}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <CommentEditFields />
    </Form>
  );
}

function CommentEditSheetFooter() {
  const t = useTranslations("Comments");
  const { canSave, formId, isSaving } = useCommentEditSession();

  return (
    <Sheet.Footer>
      <Sheet.Close>
        <Button variant="secondary" isDisabled={isSaving}>
          {t("cancel")}
        </Button>
      </Sheet.Close>
      <Button
        form={formId}
        type="submit"
        variant="secondary"
        isDisabled={!canSave || isSaving}
        isPending={isSaving}
      >
        {t("save")}
      </Button>
    </Sheet.Footer>
  );
}
