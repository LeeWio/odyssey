"use client";

import { Alert, AlertDialog, Button, Modal, Spinner, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

import {
  useGetPostRevisionsQuery,
  useRevertPostRevisionMutation,
  type PostRevision,
} from "@/lib/features/post";
import { getApiErrorMessage } from "@/lib/api/errors";

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

export function RevisionHistoryDialog({
  postId,
  isDisabled = false,
  onRestored,
}: RevisionHistoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [revisionToRestore, setRevisionToRestore] = useState<PostRevision | null>(null);
  const {
    data: revisions = [],
    isFetching,
    isError,
    refetch,
  } = useGetPostRevisionsQuery(postId, {
    skip: !isOpen,
  });
  const [revertPostRevision, { isLoading: isReverting }] = useRevertPostRevisionMutation();

  const selectedRevision = useMemo(() => revisions[0] ?? null, [revisions]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<number | null>(null);
  const activeRevision =
    revisions.find((revision) => revision.id === selectedRevisionId) ?? selectedRevision;

  const openDialog = () => {
    setRestoreError(null);
    setSelectedRevisionId(null);
    setIsOpen(true);
  };

  const closeDialog = () => {
    if (isReverting) return;
    setIsOpen(false);
    setRevisionToRestore(null);
    setRestoreError(null);
  };

  const restoreRevision = async () => {
    if (!revisionToRestore) return;

    setRestoreError(null);
    try {
      await revertPostRevision({ id: postId, revisionId: revisionToRestore.id }).unwrap();
      await onRestored?.();
      toast.success(`Version ${revisionToRestore.versionNumber} restored.`);
      setRevisionToRestore(null);
      setIsOpen(false);
    } catch (error) {
      setRestoreError(getApiErrorMessage(error, "The selected version could not be restored."));
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
              <Modal.Body className="min-h-0 gap-4 overflow-hidden p-0 sm:grid sm:grid-cols-[minmax(13rem,17rem)_minmax(0,1fr)]">
                <section
                  aria-label="Saved versions"
                  className="border-default-200 min-h-0 overflow-y-auto border-b p-4 sm:border-r sm:border-b-0"
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

                <section className="min-h-0 overflow-hidden">
                  {activeRevision ? (
                    <div className="flex h-full min-h-0 flex-col gap-6 p-5 sm:p-6">
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
                    </div>
                  ) : (
                    <div className="text-muted flex h-full min-h-48 items-center justify-center p-6 text-center text-sm">
                      Select a version to view its details.
                    </div>
                  )}
                </section>
              </Modal.Body>
              {restoreError ? (
                <Alert className="mx-5 mb-4 sm:mx-6" status="danger">
                  <Alert.Content>
                    <Alert.Title>Restore failed</Alert.Title>
                    <Alert.Description>{restoreError}</Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}
              <Modal.Footer>
                <Button variant="tertiary" onPress={closeDialog} isDisabled={isReverting}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onPress={() => setRevisionToRestore(activeRevision)}
                  isDisabled={!activeRevision || isReverting}
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
          isOpen={revisionToRestore !== null}
          variant="blur"
          isKeyboardDismissDisabled={isReverting}
          onOpenChange={(nextIsOpen) => {
            if (!nextIsOpen && !isReverting) setRevisionToRestore(null);
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
                  The current article will be replaced with version{" "}
                  {revisionToRestore?.versionNumber}. Unsaved editor changes will be discarded.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => setRevisionToRestore(null)}
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
