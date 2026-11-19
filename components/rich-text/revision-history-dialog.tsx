"use client";

import {
  Alert,
  AlertDialog,
  Button,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  toast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useId, useState } from "react";

import {
  useGetPostRevisionsQuery,
  useRevertPostRevisionMutation,
  type PostRevision,
} from "@/lib/features/post";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useCompareRevisionsQuery } from "@/lib/features/openapi/openapi-api";
import type { OpenApiComponents } from "@/lib/features/openapi/openapi.generated";

interface RevisionHistoryDialogProps {
  postId: number;
  isDisabled?: boolean;
  onRestored?: () => Promise<void> | void;
}

function formatRevisionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const comparisonFields = [
  { key: "title", label: "Title" },
  { key: "summary", label: "Summary" },
  { key: "content", label: "Body source" },
] as const;

function formatBodySource(value: string) {
  // Tiptap documents are stored as JSON. Line breaks make the source readable
  // without interpreting any saved markup or mounting an editor.
  try {
    const parsed = JSON.parse(value);
    if (parsed?.type === "doc") return JSON.stringify(parsed, null, 2);
  } catch {
    // Markdown and HTML are already source text.
  }
  return value;
}

function RevisionComparison({
  diff,
  baseVersion,
  targetVersion,
}: {
  diff: OpenApiComponents["schemas"]["PostDiffResponse"];
  baseVersion: number;
  targetVersion: number;
}) {
  const changedFields = comparisonFields.filter(({ key }) => diff[key]?.changed);

  if (changedFields.length === 0) {
    return <p className="text-muted text-sm">The title, summary, and body match.</p>;
  }

  return (
    <div className="grid min-w-0 gap-4">
      {changedFields.map(({ key, label }) => {
        const field = diff[key];
        const versions = [
          { title: `From version ${baseVersion}`, value: field?.original ?? "" },
          { title: `To version ${targetVersion}`, value: field?.revised ?? "" },
        ];

        return (
          <section key={key} aria-label={label} className="grid min-w-0 gap-2">
            <h3 className="text-foreground text-sm font-semibold">{label}</h3>
            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              {versions.map(({ title, value }) => (
                <div key={title} className="border-separator min-w-0 rounded-xl border p-3">
                  <h4 className="text-muted mb-2 text-xs font-medium">{title}</h4>
                  {value ? (
                    <pre className="text-foreground font-mono text-xs leading-relaxed wrap-anywhere whitespace-pre-wrap">
                      {key === "content" ? formatBodySource(value) : value}
                    </pre>
                  ) : (
                    <p className="text-muted text-xs">Empty</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function RevisionHistoryDialog({
  postId,
  isDisabled = false,
  onRestored,
}: RevisionHistoryDialogProps) {
  const comparisonId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreConflict, setRestoreConflict] = useState(false);
  const [restoreRequest, setRestoreRequest] = useState<{
    revision: PostRevision;
    expectedRevision: number;
  } | null>(null);
  const {
    currentData: revisions = [],
    isFetching,
    isError,
    refetch,
  } = useGetPostRevisionsQuery(postId, {
    skip: !isOpen,
    refetchOnMountOrArgChange: true,
  });
  const [revertPostRevision, { isLoading: isReverting }] = useRevertPostRevisionMutation();

  const [selectedRevisionId, setSelectedRevisionId] = useState<number | null>(null);
  const [baselineId, setBaselineId] = useState<number | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const activeRevision =
    revisions.find((revision) => revision.id === selectedRevisionId) ?? revisions[0];
  const baselineOptions = revisions.filter((revision) => revision.id !== activeRevision?.id);
  const baselineRevision =
    baselineOptions.find((revision) => revision.id === baselineId) ??
    baselineOptions.find(
      (revision) => revision.versionNumber < (activeRevision?.versionNumber ?? 0)
    ) ??
    baselineOptions[0];
  const comparison = useCompareRevisionsQuery(
    isOpen && isComparing && activeRevision && baselineRevision
      ? { id: postId, baseId: baselineRevision.id, targetId: activeRevision.id }
      : skipToken
  );

  const openDialog = () => {
    setRestoreError(null);
    setRestoreConflict(false);
    setSelectedRevisionId(null);
    setBaselineId(null);
    setIsComparing(false);
    setIsOpen(true);
  };

  const closeDialog = () => {
    if (isReverting) return;
    setIsOpen(false);
    setRestoreRequest(null);
    setRestoreError(null);
  };

  const latestRevision = revisions[0];
  const canConfirmRestore = !!activeRevision && !!latestRevision && !isFetching && !isError;

  const confirmRestore = () => {
    if (!canConfirmRestore) return;
    setRestoreError(null);
    setRestoreConflict(false);
    setRestoreRequest({ revision: activeRevision, expectedRevision: latestRevision.versionNumber });
  };

  const restoreRevision = async () => {
    if (!restoreRequest || isReverting) return;

    const { revision, expectedRevision } = restoreRequest;
    setRestoreError(null);
    try {
      await revertPostRevision({ id: postId, revisionId: revision.id, expectedRevision }).unwrap();
    } catch (error) {
      if (error && typeof error === "object" && "status" in error && error.status === 409) {
        setRestoreRequest(null);
        setRestoreConflict(true);
        void refetch();
        return;
      }
      setRestoreError(getApiErrorMessage(error, "The selected version could not be restored."));
      return;
    }

    setRestoreRequest(null);
    setIsOpen(false);
    toast.success(`Version ${revision.versionNumber} restored.`);
    try {
      await onRestored?.();
    } catch {
      toast.danger("The version was restored. Reload the editor to see it.");
    }
  };

  return (
    <>
      <Modal>
        <Button
          fullWidth
          variant="tertiary"
          isDisabled={isDisabled}
          onPress={openDialog}
          className="justify-start"
        >
          <Icon aria-hidden="true" className="size-4" icon="gravity-ui:clock-arrow-rotate-left" />
          Version history
        </Button>
        <Modal.Backdrop
          isOpen={isOpen}
          variant="blur"
          isDismissable={!isReverting}
          isKeyboardDismissDisabled={isReverting}
          onOpenChange={(nextIsOpen) => {
            if (nextIsOpen) openDialog();
            else closeDialog();
          }}
        >
          <Modal.Container size="lg">
            <Modal.Dialog
              aria-label="Version history"
              className="flex max-h-[min(46rem,calc(100vh-2rem))] flex-col overflow-hidden"
            >
              <Modal.CloseTrigger isDisabled={isReverting} />
              <Modal.Header>
                <Modal.Heading>Version history</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0 sm:grid sm:grid-cols-[minmax(13rem,17rem)_minmax(0,1fr)]">
                <section
                  aria-label="Saved versions"
                  className="border-default-200 max-h-44 min-h-0 shrink-0 overflow-y-auto border-b p-4 sm:max-h-none sm:border-r sm:border-b-0"
                >
                  {isFetching ? (
                    <div className="flex min-h-32 items-center justify-center">
                      <Spinner size="sm" />
                    </div>
                  ) : isError ? (
                    <Alert status="danger">
                      <Alert.Content>
                        <Alert.Title>Unable to load versions</Alert.Title>
                        <Alert.Description>
                          <Button size="sm" variant="tertiary" onPress={() => void refetch()}>
                            Retry
                          </Button>
                        </Alert.Description>
                      </Alert.Content>
                    </Alert>
                  ) : revisions.length === 0 ? (
                    <p className="text-muted p-2 text-sm">No saved versions yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {revisions.map((revision) => {
                        const isSelected = activeRevision?.id === revision.id;
                        return (
                          <Button
                            key={revision.id}
                            fullWidth
                            variant={isSelected ? "secondary" : "tertiary"}
                            className="h-auto justify-start px-3 py-3 text-left"
                            aria-pressed={isSelected}
                            onPress={() => setSelectedRevisionId(revision.id)}
                          >
                            <span className="flex min-w-0 flex-col items-start gap-1">
                              <span className="text-foreground font-medium">
                                Version {revision.versionNumber}
                              </span>
                              <span className="text-muted truncate text-xs">
                                {formatRevisionDate(revision.createdAt)}
                              </span>
                              <span className="text-muted truncate text-xs">
                                {revision.createdBy}
                              </span>
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section aria-label="Selected version" className="min-h-0 flex-1 overflow-y-auto">
                  {activeRevision ? (
                    <div className="flex min-w-0 flex-col gap-5 p-5 sm:p-6">
                      <div className="space-y-2">
                        <p className="text-muted text-xs font-medium tracking-normal uppercase">
                          Selected version
                        </p>
                        <h2 className="text-foreground text-xl font-semibold">
                          {activeRevision.title || "Untitled article"}
                        </h2>
                        <p className="text-muted text-sm">
                          Version {activeRevision.versionNumber} ·{" "}
                          {formatRevisionDate(activeRevision.createdAt)}
                        </p>
                      </div>
                      <div className="border-default-200 flex flex-col gap-3 border-y py-4">
                        <p className="text-muted text-sm">
                          Saved by{" "}
                          <span className="text-foreground">{activeRevision.createdBy}</span>
                        </p>
                        {activeRevision.summary ? (
                          <p className="text-muted text-sm leading-6">{activeRevision.summary}</p>
                        ) : null}
                      </div>

                      {baselineRevision ? (
                        <div className="grid min-w-0 gap-4">
                          <div>
                            <Button
                              size="sm"
                              variant="secondary"
                              aria-expanded={isComparing}
                              aria-controls={isComparing ? comparisonId : undefined}
                              onPress={() => setIsComparing((current) => !current)}
                            >
                              {isComparing ? "Hide comparison" : "Compare versions"}
                            </Button>
                          </div>
                          {isComparing ? (
                            <section
                              id={comparisonId}
                              aria-label="Version comparison"
                              className="grid min-w-0 gap-4"
                            >
                              <Select
                                value={baselineRevision.id}
                                onChange={(key) => setBaselineId(key == null ? null : Number(key))}
                              >
                                <Label>Compare from</Label>
                                <Select.Trigger>
                                  <Select.Value />
                                  <Select.Indicator />
                                </Select.Trigger>
                                <Select.Popover>
                                  <ListBox>
                                    {baselineOptions.map((revision) => (
                                      <ListBox.Item
                                        key={revision.id}
                                        id={revision.id}
                                        textValue={`Version ${revision.versionNumber}`}
                                      >
                                        Version {revision.versionNumber}
                                        <ListBox.ItemIndicator />
                                      </ListBox.Item>
                                    ))}
                                  </ListBox>
                                </Select.Popover>
                              </Select>
                              <p className="text-muted text-sm">
                                Version {baselineRevision.versionNumber} → version{" "}
                                {activeRevision.versionNumber}
                              </p>
                              {comparison.isFetching ? (
                                <div
                                  role="status"
                                  className="text-muted flex items-center gap-2 text-sm"
                                >
                                  <Spinner size="sm" />
                                  Loading comparison…
                                </div>
                              ) : comparison.isError || !comparison.currentData ? (
                                <Alert status="danger">
                                  <Alert.Content>
                                    <Alert.Title>Unable to compare versions</Alert.Title>
                                    <Alert.Description>
                                      <Button
                                        size="sm"
                                        variant="tertiary"
                                        onPress={() => void comparison.refetch()}
                                      >
                                        Retry comparison
                                      </Button>
                                    </Alert.Description>
                                  </Alert.Content>
                                </Alert>
                              ) : (
                                <RevisionComparison
                                  diff={comparison.currentData}
                                  baseVersion={baselineRevision.versionNumber}
                                  targetVersion={activeRevision.versionNumber}
                                />
                              )}
                            </section>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-muted flex h-full min-h-48 items-center justify-center p-6 text-center text-sm">
                      Select a version to view its details.
                    </div>
                  )}
                </section>
              </Modal.Body>
              {restoreConflict ? (
                <Alert className="mx-5 mb-4 sm:mx-6" status="warning">
                  <Alert.Content>
                    <Alert.Title>A newer version was saved</Alert.Title>
                    <Alert.Description>
                      Review the latest saved version before confirming the restore again.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}
              <Modal.Footer>
                <Button variant="tertiary" onPress={closeDialog} isDisabled={isReverting}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onPress={confirmRestore}
                  isDisabled={!canConfirmRestore || isReverting}
                >
                  Restore selected version
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={restoreRequest !== null}
          variant="blur"
          isKeyboardDismissDisabled={isReverting}
          onOpenChange={(nextIsOpen) => {
            if (!nextIsOpen && !isReverting) setRestoreRequest(null);
          }}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.Header>
                <AlertDialog.Icon status="warning" />
                <AlertDialog.Heading>Restore this version?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  Restore version {restoreRequest?.revision.versionNumber} over the current saved
                  version {restoreRequest?.expectedRevision}. Unsaved editor changes will be
                  discarded.
                </p>
                {restoreError ? (
                  <Alert status="danger">
                    <Alert.Content>
                      <Alert.Title>Restore failed</Alert.Title>
                      <Alert.Description>{restoreError}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                ) : null}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => setRestoreRequest(null)}
                  isDisabled={isReverting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onPress={() => void restoreRevision()}
                  isPending={isReverting}
                >
                  {({ isPending }) => (
                    <>
                      {isPending ? <Spinner color="current" size="sm" /> : null}
                      Restore version
                    </>
                  )}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}
