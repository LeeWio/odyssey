"use client";

import { Alert, Button, Input, Label, Modal, Spinner, TextField, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import {
  useArchivePostMutation,
  useCancelScheduledPostMutation,
  useRestoreArchivedPostMutation,
  useReviewPostMutation,
  useSchedulePostMutation,
  useSubmitForReviewMutation,
  useWithdrawFromReviewMutation,
} from "@/lib/features/openapi";
import type { PostStatus } from "@/lib/features/post";

interface PublishingWorkflowProps {
  postId: number;
  status: PostStatus;
  scheduledAt?: string;
  isDisabled?: boolean;
  onStatusChange: (status: PostStatus) => void;
  onCompleted: () => Promise<void> | void;
}

type FormAction = "schedule" | "reject" | "archive";

const STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

export function PublishingWorkflow({
  postId,
  status,
  scheduledAt,
  isDisabled = false,
  onStatusChange,
  onCompleted,
}: PublishingWorkflowProps) {
  const [formAction, setFormAction] = useState<FormAction | null>(null);
  const [scheduleValue, setScheduleValue] = useState(() => toDateTimeLocal(scheduledAt));
  const [reviewComment, setReviewComment] = useState("");
  const [archiveReason, setArchiveReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const [submitForReview, submitState] = useSubmitForReviewMutation();
  const [withdrawFromReview, withdrawState] = useWithdrawFromReviewMutation();
  const [schedulePost, scheduleState] = useSchedulePostMutation();
  const [cancelScheduledPost, cancelScheduleState] = useCancelScheduledPostMutation();
  const [reviewPost, reviewState] = useReviewPostMutation();
  const [restoreArchivedPost, restoreState] = useRestoreArchivedPostMutation();
  const [archivePost, archiveState] = useArchivePostMutation();

  const isPending =
    isConfirming ||
    submitState.isLoading ||
    withdrawState.isLoading ||
    scheduleState.isLoading ||
    cancelScheduleState.isLoading ||
    reviewState.isLoading ||
    restoreState.isLoading ||
    archiveState.isLoading;

  const closeForm = () => {
    if (isPending) return;
    setFormAction(null);
    setError(null);
  };

  const runAction = async (nextStatus: PostStatus, action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      onStatusChange(nextStatus);
      await onCompleted();
      toast.success(`Article status changed to ${STATUS_LABELS[nextStatus]}.`);
      closeForm();
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "The publishing action could not be completed."));
    }
  };

  const confirmFormAction = async () => {
    if (formAction === "schedule") {
      if (!scheduleValue) {
        setError("Choose a publication date and time.");
        return;
      }

      const scheduledDate = new Date(scheduleValue);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        setError("The scheduled publication time must be in the future.");
        return;
      }

      await runAction("SCHEDULED", () =>
        schedulePost({ id: postId, body: { scheduledAt: toIsoDateTime(scheduleValue) } }).unwrap()
      );
      return;
    }

    if (formAction === "reject") {
      await runAction("REJECTED", () =>
        reviewPost({
          id: postId,
          body: { approved: false, reviewComment: reviewComment.trim() || undefined },
        }).unwrap()
      );
      return;
    }

    if (formAction === "archive") {
      if (!archiveReason.trim()) {
        setError("Add a reason before archiving this article.");
        return;
      }

      await runAction("ARCHIVED", () =>
        archivePost({ id: postId, body: { reason: archiveReason.trim() } }).unwrap()
      );
    }
  };

  const openForm = (action: FormAction) => {
    setError(null);
    if (action === "schedule") setScheduleValue(toDateTimeLocal(scheduledAt));
    setFormAction(action);
  };

  const handleSimpleAction = async (nextStatus: PostStatus, action: () => Promise<unknown>) => {
    setIsConfirming(true);
    await runAction(nextStatus, action);
    setIsConfirming(false);
  };

  return (
    <section className="flex flex-col gap-4" aria-label="Publishing workflow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Icon
            aria-hidden="true"
            className="text-muted-foreground mt-0.5 size-4"
            icon="gravity-ui:circle-check"
          />
          <div className="min-w-0">
            <p className="text-foreground text-sm font-semibold">Publishing workflow</p>
            <p className="text-muted text-xs">
              Current status: <span className="text-foreground">{STATUS_LABELS[status]}</span>
            </p>
            {status === "SCHEDULED" && scheduledAt ? (
              <p className="text-muted mt-1 text-xs">
                Publishes {new Date(scheduledAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        </div>
        {isPending ? <Spinner aria-label="Updating publishing status" size="sm" /> : null}
      </div>

      {error ? (
        <Alert status="danger" role="alert">
          <Alert.Content>
            <Alert.Title>Action failed</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(status === "DRAFT" || status === "REJECTED") && (
          <>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={isDisabled || isPending}
              onPress={() =>
                void handleSimpleAction("PENDING_REVIEW", () =>
                  submitForReview({ id: postId }).unwrap()
                )
              }
            >
              Submit for review
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={isDisabled || isPending}
              onPress={() => openForm("schedule")}
            >
              Schedule publish
            </Button>
          </>
        )}
        {status === "PENDING_REVIEW" && (
          <>
            <Button
              size="sm"
              variant="primary"
              isDisabled={isDisabled || isPending}
              onPress={() =>
                void handleSimpleAction("PUBLISHED", () =>
                  reviewPost({ id: postId, body: { approved: true } }).unwrap()
                )
              }
            >
              Approve and publish
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={isDisabled || isPending}
              onPress={() => openForm("reject")}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={isDisabled || isPending}
              onPress={() =>
                void handleSimpleAction("DRAFT", () => withdrawFromReview({ id: postId }).unwrap())
              }
            >
              Withdraw
            </Button>
          </>
        )}
        {status === "SCHEDULED" && (
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={isDisabled || isPending}
            onPress={() =>
              void handleSimpleAction("DRAFT", () => cancelScheduledPost({ id: postId }).unwrap())
            }
          >
            Cancel schedule
          </Button>
        )}
        {status === "PUBLISHED" && (
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={isDisabled || isPending}
            onPress={() => openForm("archive")}
          >
            Archive article
          </Button>
        )}
        {status === "ARCHIVED" && (
          <Button
            size="sm"
            variant="secondary"
            isDisabled={isDisabled || isPending}
            onPress={() =>
              void handleSimpleAction("DRAFT", () => restoreArchivedPost({ id: postId }).unwrap())
            }
          >
            Restore to draft
          </Button>
        )}
      </div>

      <Modal>
        <Modal.Backdrop
          isOpen={formAction !== null}
          variant="blur"
          isDismissable={!isPending}
          isKeyboardDismissDisabled={isPending}
          onOpenChange={(open) => {
            if (!open) closeForm();
          }}
        >
          <Modal.Container>
            <Modal.Dialog
              aria-label={
                formAction === "schedule"
                  ? "Schedule publication"
                  : formAction === "reject"
                    ? "Reject article"
                    : "Archive article"
              }
            >
              <Modal.CloseTrigger isDisabled={isPending} />
              <Modal.Header>
                <Modal.Heading>
                  {formAction === "schedule"
                    ? "Schedule publication"
                    : formAction === "reject"
                      ? "Reject article"
                      : "Archive article"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                {formAction === "schedule" ? (
                  <TextField isRequired>
                    <Label>Publication date and time</Label>
                    <Input
                      type="datetime-local"
                      value={scheduleValue}
                      onChange={(event) => setScheduleValue(event.target.value)}
                    />
                  </TextField>
                ) : null}
                {formAction === "reject" ? (
                  <TextField>
                    <Label>Review comment</Label>
                    <Input
                      placeholder="Explain what needs to change"
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                    />
                  </TextField>
                ) : null}
                {formAction === "archive" ? (
                  <TextField isRequired>
                    <Label>Archive reason</Label>
                    <Input
                      placeholder="Why is this article being archived?"
                      value={archiveReason}
                      onChange={(event) => setArchiveReason(event.target.value)}
                    />
                  </TextField>
                ) : null}
                {error ? (
                  <p className="text-danger text-sm" role="alert">
                    {error}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" isDisabled={isPending} onPress={closeForm}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  isPending={isPending}
                  onPress={() => void confirmFormAction()}
                >
                  Confirm
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </section>
  );
}
