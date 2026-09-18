"use client";

import { Icon } from "@iconify/react";
import { useState } from "react";

import { AlertDialog, Button, Dropdown, Header, Label, Spinner, Tooltip, cn } from "@heroui/react";
import { useCommentContext } from "./context/comment-context";
import type { EnhancedComment } from "./types";
import { resolveCommentCapabilities } from "./utils/permissions";

export const COMMENT_REPORT_REASONS = [
  { id: "spam", label: "Spam" },
  { id: "harassment", label: "Harassment" },
  { id: "inappropriate", label: "Inappropriate" },
  { id: "misinformation", label: "Misinformation" },
  { id: "other", label: "Other" },
] as const;

export type CommentReportReason = (typeof COMMENT_REPORT_REASONS)[number]["id"];

interface CommentActionsProps {
  comment: EnhancedComment;
  onLikeToggle: () => void;
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
  onReplyToggle,
  onEditStart,
  onDelete,
  onReport,
  onCopyLink,
  isReplying,
  depth,
}: CommentActionsProps) {
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
  const liked = Boolean(comment.likedByCurrentUser);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const deleted = await onDelete();
      if (deleted !== false) setDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        role="group"
        aria-label="Comment actions"
        className="text-muted mt-2 flex items-center gap-0.5"
      >
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 gap-1.5 px-2 text-xs",
            liked ? "text-danger hover:text-danger" : "text-muted hover:text-foreground"
          )}
          aria-label={liked ? "Unlike comment" : "Like comment"}
          isDisabled={isUnavailable || isUnapproved}
          onPress={onLikeToggle}
        >
          <Icon
            icon={liked ? "gravity-ui:heart-fill" : "gravity-ui:heart"}
            className="size-3.5"
            aria-hidden="true"
          />
          <span className="tabular-nums">{comment.likesCount ?? 0}</span>
        </Button>

        {depth <= 2 ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted hover:text-foreground h-7 px-2 text-xs"
            isDisabled={isUnavailable || isUnapproved}
            onPress={onReplyToggle}
          >
            {isReplying ? "Cancel" : "Reply"}
          </Button>
        ) : null}

        <Dropdown>
          <Tooltip delay={0}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="text-muted hover:text-foreground size-7"
              aria-label="More comment actions"
              isDisabled={isUnavailable}
            >
              <Icon icon="gravity-ui:ellipsis" aria-hidden="true" className="size-3.5" />
            </Button>
            <Tooltip.Content>
              <p>More</p>
            </Tooltip.Content>
          </Tooltip>
          <Dropdown.Popover>
            <Dropdown.Menu
              onAction={(key) => {
                const action = String(key);
                if (action === "copy") onCopyLink();
                if (action === "edit") onEditStart();
                if (action === "delete") setDeleteOpen(true);
                if (action.startsWith("report:")) {
                  const reason = action.slice("report:".length);
                  if (isReportReason(reason)) onReport(reason);
                }
              }}
            >
              <Dropdown.Item id="copy" textValue="Copy link">
                <Icon icon="gravity-ui:link" />
                Copy link
              </Dropdown.Item>
              {canEdit || canDelete ? (
                <>
                  {canEdit ? (
                    <Dropdown.Item id="edit" textValue="Edit comment">
                      <Icon icon="gravity-ui:pencil" />
                      Edit
                    </Dropdown.Item>
                  ) : null}
                  {canDelete ? (
                    <Dropdown.Item id="delete" textValue="Delete comment" variant="danger">
                      <Icon icon="gravity-ui:trash-bin" />
                      Delete
                    </Dropdown.Item>
                  ) : null}
                </>
              ) : (
                <Dropdown.Section>
                  <Header>Report</Header>
                  {COMMENT_REPORT_REASONS.map((reason) => (
                    <Dropdown.Item
                      key={reason.id}
                      id={`report:${reason.id}`}
                      textValue={`Report as ${reason.label}`}
                      variant="danger"
                    >
                      <Label>{reason.label}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Section>
              )}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      <AlertDialog>
        <AlertDialog.Backdrop isOpen={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md" aria-label="Delete comment">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete this comment?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                This removes your comment from the public thread. If others already replied, it may
                remain as a placeholder so the conversation stays readable.
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="ghost" onPress={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  isDisabled={isDeleting}
                  onPress={() => void handleDeleteConfirm()}
                >
                  {isDeleting ? <Spinner size="sm" className="text-white" /> : "Delete"}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}
