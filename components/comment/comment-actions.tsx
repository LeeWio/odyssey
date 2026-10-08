"use client";

import { Icon } from "@iconify/react";
import { useRef, useState } from "react";

import {
  AlertDialog,
  Button,
  Dropdown,
  Header,
  Label,
  Spinner,
  Tooltip,
  cn,
  toast,
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { useCommentContext } from "./context/comment-context";
import type { EnhancedComment } from "./types";
import { resolveCommentCapabilities } from "./utils/permissions";

export const COMMENT_REPORT_REASONS = [
  { id: "spam", labelKey: "spam" },
  { id: "harassment", labelKey: "harassment" },
  { id: "inappropriate", labelKey: "inappropriate" },
  { id: "misinformation", labelKey: "misinformation" },
  { id: "other", labelKey: "other" },
] as const;

export type CommentReportReason = (typeof COMMENT_REPORT_REASONS)[number]["id"];

interface CommentActionsProps {
  comment: EnhancedComment;
  onLikeToggle: () => void;
  isLiking: boolean;
  onReplyToggle: () => void;
  onEditStart: () => void;
  onDelete: () => Promise<boolean> | boolean | void;
  onReport: (reason: CommentReportReason) => void;
  onCopyLink: () => void;
  isReplying: boolean;
  depth: number;
}

function isReportReason(value: string): value is CommentReportReason {
  return COMMENT_REPORT_REASONS.some((reason) => reason.id === value);
}

export function CommentActions({
  comment,
  onLikeToggle,
  isLiking,
  onReplyToggle,
  onEditStart,
  onDelete,
  onReport,
  onCopyLink,
  isReplying,
  depth,
}: CommentActionsProps) {
  const t = useTranslations("Comments");
  const { currentUser, currentUserId, isAuthenticated } = useCommentContext();
  const { canEdit, canDelete } = resolveCommentCapabilities(comment, {
    isAuthenticated,
    currentUserId,
    currentUsername: currentUser,
  });
  const isUnavailable = Boolean(comment.isPending || comment.isFailed);
  const isUnapproved = comment.status === "PENDING" || comment.id < 0;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleting = useRef(false);
  const liked = Boolean(comment.likedByCurrentUser);

  const changeDeleteOpen = (open: boolean) => {
    if (!deleting.current) setDeleteOpen(open);
  };

  const handleDeleteConfirm = async () => {
    if (deleting.current) return;
    deleting.current = true;
    setIsDeleting(true);
    try {
      const deleted = await onDelete();
      if (deleted !== false) setDeleteOpen(false);
    } catch {
      // The mutation normally reports API errors and returns false. Keep the
      // dialog usable even if a caller unexpectedly rejects instead.
      toast.danger(t("deleteFailed"));
    } finally {
      deleting.current = false;
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        role="group"
        aria-label={t("actions")}
        className="text-muted mt-2 flex items-center gap-0.5"
      >
        <Button
          size="sm"
          variant={liked ? "danger" : "ghost"}
          aria-label={liked ? t("unlike") : t("like")}
          aria-pressed={liked}
          isPending={isLiking}
          isDisabled={isUnavailable || isUnapproved || isLiking}
          onPress={onLikeToggle}
        >
          <Icon
            icon={liked ? "gravity-ui:heart-fill" : "gravity-ui:heart"}
            className="size-3.5"
            aria-hidden="true"
          />
          <span>{comment.likesCount ?? 0}</span>
        </Button>

        {depth <= 2 ? (
          <Button
            size="sm"
            variant="ghost"
            isDisabled={isUnavailable || isUnapproved}
            onPress={onReplyToggle}
          >
            {isReplying ? t("cancel") : t("reply")}
          </Button>
        ) : null}

        <Dropdown>
          <Tooltip delay={0}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={t("moreActions")}
              isDisabled={isUnavailable}
            >
              <Icon icon="gravity-ui:ellipsis" aria-hidden="true" className="size-3.5" />
            </Button>
            <Tooltip.Content>
              <p>{t("more")}</p>
            </Tooltip.Content>
          </Tooltip>
          <Dropdown.Popover>
            <Dropdown.Menu
              onAction={(key) => {
                const action = String(key);
                if (action === "copy") onCopyLink();
                if (action === "edit") onEditStart();
                if (action === "delete") changeDeleteOpen(true);
                if (action.startsWith("report:")) {
                  const reason = action.slice("report:".length);
                  if (isReportReason(reason)) onReport(reason);
                }
              }}
            >
              <Dropdown.Item id="copy" textValue={t("copyLink")}>
                <Icon icon="gravity-ui:link" />
                {t("copyLink")}
              </Dropdown.Item>
              {canEdit || canDelete ? (
                <>
                  {canEdit ? (
                    <Dropdown.Item id="edit" textValue={t("editComment")}>
                      <Icon icon="gravity-ui:pencil" />
                      {t("edit")}
                    </Dropdown.Item>
                  ) : null}
                  {canDelete ? (
                    <Dropdown.Item id="delete" textValue={t("deleteComment")} variant="danger">
                      <Icon icon="gravity-ui:trash-bin" />
                      {t("delete")}
                    </Dropdown.Item>
                  ) : null}
                </>
              ) : (
                <Dropdown.Section>
                  <Header>{t("report")}</Header>
                  {COMMENT_REPORT_REASONS.map((reason) => {
                    const label = t(reason.labelKey);
                    return (
                      <Dropdown.Item
                        key={reason.id}
                        id={`report:${reason.id}`}
                        textValue={t("reportAs", { reason: label })}
                        variant="danger"
                      >
                        <Label>{label}</Label>
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Section>
              )}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={deleteOpen}
          onOpenChange={changeDeleteOpen}
          isDismissable={false}
          isKeyboardDismissDisabled
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md" aria-label={t("deleteComment")}>
              <AlertDialog.CloseTrigger isDisabled={isDeleting} />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>{t("deleteTitle")}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {t("deleteHint")}
                {isDeleting ? (
                  <p role="status" className="text-muted mt-2 text-sm">
                    {t("deleting")}
                  </p>
                ) : null}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  variant="ghost"
                  isDisabled={isDeleting}
                  onPress={() => changeDeleteOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="danger"
                  isPending={isDeleting}
                  isDisabled={isDeleting}
                  onPress={() => void handleDeleteConfirm()}
                >
                  {isDeleting ? (
                    <Spinner size="sm" className="text-white" aria-hidden="true" />
                  ) : null}
                  {t("delete")}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}
