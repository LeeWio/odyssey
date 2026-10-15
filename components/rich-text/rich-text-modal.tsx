"use client";

import { Alert, AlertDialog, Button, Modal, Spinner, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";
import { Sheet } from "@heroui-pro/react";
import { useMediaQuery } from "@mantine/hooks";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { getApiErrorMessage } from "@/lib/api/errors";
import { RichText } from "@/components/rich-text/rich-text";
import { RichTextForm } from "@/components/rich-text/rich-text-form";
import { PublishingWorkflow } from "@/components/rich-text/publishing-workflow";
import { RevisionHistoryDialog } from "@/components/rich-text/revision-history-dialog";
import { MotionButton } from "@/components/ui";
import { closeRichText, selectRichTextState } from "@/lib/features";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { microEaseOut } from "@/lib/motion";
import {
  clearRichTextDraft,
  type RichTextDraft,
  readRichTextDraft,
  saveRichTextDraft,
} from "./utils/editor-draft";
import {
  getMediaValidationIssues,
  hasPendingMediaUploads,
  normalizeJSONContent,
  normalizeRichTextDocument,
  parseJSONContent,
  removeTemporaryMediaAttributes,
} from "./utils/document-normalizer";
import {
  useAutosavePostMutation,
  useCreatePostMutation,
  useGetAutosaveQuery,
  useGetAdminPostByIdQuery,
  useUpdatePostMutation,
  type PostResponse,
  type PostRequest,
} from "@/lib/features/post";

const EMPTY_POST_DATA: Partial<PostRequest> = {
  status: "DRAFT",
  tagIds: [],
};

function toPostData(post: PostResponse): Partial<PostRequest> {
  return {
    title: post.title,
    slug: post.slug,
    summary: post.summary || "",
    status: post.status,
    coverImage: post.coverImage || "",
    isFeatured: post.isFeatured,
    categoryId: post.category?.id,
    seriesId: post.series?.id,
    seriesOrder: post.seriesOrder ?? 0,
    tagIds: post.tags?.map((tag) => tag.id) || [],
  };
}

function serializePostData(data: Partial<PostRequest>): string {
  return JSON.stringify({
    title: data.title?.trim() || "",
    slug: data.slug?.trim() || "",
    summary: data.summary || "",
    status: data.status || "DRAFT",
    coverImage: data.coverImage || "",
    isFeatured: Boolean(data.isFeatured),
    categoryId: data.categoryId ?? null,
    seriesId: data.seriesId ?? null,
    seriesOrder: data.seriesOrder ?? 0,
    tagIds: [...(data.tagIds || [])].sort((a, b) => a - b),
  });
}

function serializeDocument(content: ProseMirrorNode | ReturnType<typeof normalizeJSONContent>) {
  return JSON.stringify(
    normalizeRichTextDocument("toJSON" in content ? content.toJSON() : content)
  );
}

function areMediaIssuesEqual(
  currentIssues: ReturnType<typeof getMediaValidationIssues>,
  nextIssues: ReturnType<typeof getMediaValidationIssues>
) {
  return (
    currentIssues.length === nextIssues.length &&
    currentIssues.every(
      (issue, index) =>
        issue.code === nextIssues[index]?.code && issue.nodeType === nextIssues[index]?.nodeType
    )
  );
}

export function RichTextModal() {
  const { isOpen, activeId } = useAppSelector(selectRichTextState);
  const dispatch = useAppDispatch();

  const [showForm, setShowForm] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)", false);
  const editorRef = useRef<Editor | null>(null);
  const initialEditorDocumentRef = useRef<ProseMirrorNode | null>(null);
  const initialPostDataRef = useRef(serializePostData(EMPTY_POST_DATA));
  const [isContentDirty, setIsContentDirty] = useState(false);
  const [isMetadataDirty, setIsMetadataDirty] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isDraftRecoveryDialogOpen, setIsDraftRecoveryDialogOpen] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState<RichTextDraft | null>(null);
  const [recoverySource, setRecoverySource] = useState<"browser" | "server" | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorInstanceVersion, setEditorInstanceVersion] = useState(0);
  const [isPostDataReady, setIsPostDataReady] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [mediaIssues, setMediaIssues] = useState(() =>
    getMediaValidationIssues(normalizeJSONContent(undefined))
  );
  const [contentSchemaError, setContentSchemaError] = useState<{
    activeId: string;
    message: string;
  } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const lastSaveStatusRef = useRef<PostRequest["status"]>("DRAFT");
  const autosaveSequenceRef = useRef(0);

  // Reset showForm when modal opens or activeId changes
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowForm(false);
    }
  }, [isOpen, activeId]);

  // Form State
  const [postData, setPostData] = useState<Partial<PostRequest>>(EMPTY_POST_DATA);

  // API Mutations
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const [autosavePost] = useAutosavePostMutation();

  const isPending = isCreating || isUpdating || isCoverUploading;
  const hasContentSchemaError = contentSchemaError?.activeId === activeId;
  const isExistingPost = Boolean(activeId && !Number.isNaN(Number(activeId)));

  const saveDraft = useDebouncedCallback(
    (
      draftId: string | null,
      editor: Editor | null,
      data: Partial<PostRequest>,
      isEnabled: boolean
    ) => {
      if (!isEnabled || !draftId || !editor || editor.isDestroyed) return;

      const content = editor.getJSON();
      if (hasPendingMediaUploads(content)) return;

      saveRichTextDraft(draftId, content, data);
    },
    750
  );
  const saveServerDraft = useDebouncedCallback(
    async (draftId: string | null, editor: Editor | null, isEnabled: boolean) => {
      if (!isEnabled || !isExistingPost || !draftId || !editor || editor.isDestroyed) return;

      const content = editor.getJSON();
      if (hasPendingMediaUploads(content)) return;

      const sequence = ++autosaveSequenceRef.current;
      setIsAutosaving(true);
      setAutosaveError(null);

      try {
        await autosavePost({
          identifier: draftId,
          content: content as Record<string, unknown>,
        }).unwrap();
        if (sequence === autosaveSequenceRef.current) setIsAutosaving(false);
      } catch (error) {
        if (sequence !== autosaveSequenceRef.current) return;
        setIsAutosaving(false);
        setAutosaveError(getApiErrorMessage(error, "Server autosave failed. Try again."));
      }
    },
    1200
  );
  const updateMediaIssues = useDebouncedCallback((editor: Editor) => {
    if (editor.isDestroyed) return;

    const nextMediaIssues = getMediaValidationIssues(editor.getJSON());
    queueMicrotask(() => {
      if (editor.isDestroyed) return;
      setMediaIssues((currentIssues) =>
        areMediaIssuesEqual(currentIssues, nextMediaIssues) ? currentIssues : nextMediaIssues
      );
    });
  }, 200);

  // Fetch existing post data if activeId is a numeric string (existing ID)
  const {
    data: existingPost,
    isLoading: isFetching,
    refetch: refetchExistingPost,
  } = useGetAdminPostByIdQuery(Number(activeId), {
    skip: !isExistingPost || !isOpen,
  });
  const { data: serverAutosave } = useGetAutosaveQuery(activeId ?? "", {
    skip: !isExistingPost || !isOpen,
  });
  const existingContentIsEditable = useMemo(() => {
    if (!existingPost) return true;
    return existingPost.contentType === "JSON" && parseJSONContent(existingPost.content) !== null;
  }, [existingPost]);
  const editorContent = useMemo(
    () => normalizeJSONContent(existingPost?.content),
    [existingPost?.content]
  );
  const serverAutosaveContent = useMemo(
    () => (serverAutosave ? parseJSONContent(serverAutosave.content) : null),
    [serverAutosave]
  );

  useEffect(() => {
    editorRef.current = null;
    initialEditorDocumentRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsEditorReady(false);
    setEditorInstanceVersion(0);
    setIsPostDataReady(false);
    setIsCoverUploading(false);
    setIsContentDirty(false);
    setIsMetadataDirty(false);
    setIsDraftRecoveryDialogOpen(false);
    setRecoveryDraft(null);
    setRecoverySource(null);
    setContentSchemaError(null);
    setSaveError(null);
    setAutosaveError(null);
    setIsAutosaving(false);
    setMediaIssues([]);
  }, [activeId, isOpen]);

  useEffect(() => {
    if (!isOpen || !activeId || !isPostDataReady || !existingContentIsEditable) return;

    const localDraft = readRichTextDraft(activeId);
    const serverDraft =
      existingPost &&
      serverAutosaveContent &&
      serializeDocument(serverAutosaveContent) !== serializeDocument(editorContent)
        ? {
            content: serverAutosaveContent,
            postData: toPostData(existingPost),
            savedAt: Date.now(),
            version: 1 as const,
          }
        : null;
    const draft = localDraft ?? serverDraft;
    const timer = window.setTimeout(() => {
      setRecoveryDraft(draft);
      setRecoverySource(localDraft ? "browser" : serverDraft ? "server" : null);
      setIsDraftRecoveryDialogOpen(Boolean(draft));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    activeId,
    editorContent,
    existingContentIsEditable,
    existingPost,
    isOpen,
    isPostDataReady,
    serverAutosaveContent,
  ]);

  // Initialize form with existing post data
  useEffect(() => {
    if (!isOpen) return;

    const nextPostData = existingPost
      ? toPostData(existingPost)
      : activeId && !isExistingPost
        ? EMPTY_POST_DATA
        : null;
    if (!nextPostData) return;

    initialPostDataRef.current = serializePostData(nextPostData);
    const timer = window.setTimeout(() => {
      setPostData(nextPostData);
      setIsMetadataDirty(false);
      setIsPostDataReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [existingPost, activeId, isExistingPost, isOpen]);

  const isDirty = isContentDirty || isMetadataDirty;

  const handlePostDataChange = (nextPostData: Partial<PostRequest>) => {
    setPostData(nextPostData);
    setSaveError(null);
    setIsMetadataDirty(serializePostData(nextPostData) !== initialPostDataRef.current);
    saveDraft(
      activeId,
      editorRef.current,
      nextPostData,
      Boolean(isOpen && activeId && isPostDataReady && !hasContentSchemaError)
    );
    saveServerDraft(
      activeId,
      editorRef.current,
      Boolean(isOpen && activeId && isPostDataReady && !hasContentSchemaError)
    );
  };

  useEffect(() => {
    return () => {
      saveDraft.cancel();
      saveServerDraft.cancel();
      updateMediaIssues.cancel();
    };
  }, [activeId, hasContentSchemaError, isOpen, saveDraft, saveServerDraft, updateMediaIssues]);

  useEffect(() => {
    if (!isOpen || !isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isOpen]);

  const closeEditor = () => {
    saveDraft.cancel();
    saveServerDraft.cancel();
    dispatch(closeRichText());
    setShowForm(false);
    setIsDiscardDialogOpen(false);
    setIsDraftRecoveryDialogOpen(false);
    setRecoveryDraft(null);
    setRecoverySource(null);
    setContentSchemaError(null);
    setSaveError(null);
    setAutosaveError(null);
    setIsAutosaving(false);
  };

  const requestClose = () => {
    if (isPending) return;

    if (isDirty) {
      setIsDiscardDialogOpen(true);
      return;
    }

    closeEditor();
  };

  const discardLocalDraft = () => {
    clearRichTextDraft(activeId);
    setRecoveryDraft(null);
    setIsDraftRecoveryDialogOpen(false);
    setRecoverySource(null);
  };

  const discardChanges = () => {
    clearRichTextDraft(activeId);
    closeEditor();
  };

  const restoreDraft = () => {
    if (!recoveryDraft || !editorRef.current || hasContentSchemaError) return;

    try {
      editorRef.current.commands.setContent(recoveryDraft.content, {
        emitUpdate: false,
        errorOnInvalidContent: true,
      });
    } catch (error) {
      setContentSchemaError({
        activeId: activeId || "unknown",
        message: error instanceof Error ? error.message : "The recovered draft is incompatible.",
      });
      return;
    }

    const restoredPostData = recoveryDraft.postData;
    setPostData(restoredPostData);
    setIsContentDirty(
      initialEditorDocumentRef.current
        ? !initialEditorDocumentRef.current.eq(editorRef.current.state.doc)
        : true
    );
    setIsMetadataDirty(serializePostData(restoredPostData) !== initialPostDataRef.current);
    saveDraft(activeId, editorRef.current, restoredPostData, Boolean(isOpen && activeId));
    saveServerDraft(activeId, editorRef.current, Boolean(isOpen && activeId && isExistingPost));
    setRecoveryDraft(null);
    setIsDraftRecoveryDialogOpen(false);
    setRecoverySource(null);
  };

  const handleSave = async (statusOverride?: PostRequest["status"]) => {
    const requestedStatus = statusOverride || postData.status || "DRAFT";
    lastSaveStatusRef.current = requestedStatus;
    setSaveError(null);
    if (hasContentSchemaError) {
      toast.danger(
        "This document is incompatible with the current editor schema and cannot be saved."
      );
      return;
    }

    if (!existingContentIsEditable) {
      toast.danger(
        "This article is not stored as a valid Tiptap JSON document and cannot be saved here."
      );
      return;
    }

    const content = editorRef.current?.getJSON();
    if (!content) {
      toast.warning("The editor is still loading. Try saving again in a moment.");
      return;
    }

    const nextMediaIssues = getMediaValidationIssues(content);
    const hasUnresolvedUpload = nextMediaIssues.some(
      (issue) => issue.code === "pending-upload" || issue.code === "missing-source"
    );
    if (hasUnresolvedUpload) {
      toast.warning("Finish, retry, or remove media uploads before saving.");
      return;
    }

    if (statusOverride === "PUBLISHED" && nextMediaIssues.length > 0) {
      toast.warning("Resolve the media accessibility issues before publishing.");
      return;
    }

    const title = postData.title?.trim();
    const slug = postData.slug?.trim();
    if (!title || !slug) {
      toast.warning("Title and slug are required before saving.");
      return;
    }

    const payload: PostRequest = {
      ...(postData as PostRequest),
      title,
      slug,
      content: JSON.stringify(normalizeRichTextDocument(removeTemporaryMediaAttributes(content))),
      contentType: "JSON",
      status: requestedStatus,
    };

    try {
      if (isExistingPost) {
        await updatePost({ id: Number(activeId), body: payload }).unwrap();
      } else {
        await createPost(payload).unwrap();
      }
      saveServerDraft.cancel();
      setAutosaveError(null);
      clearRichTextDraft(activeId);
      closeEditor();
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "The article could not be saved. Try again."));
    }
  };

  const handleRevisionRestored = async () => {
    clearRichTextDraft(activeId);
    saveDraft.cancel();
    saveServerDraft.cancel();
    setIsContentDirty(false);
    setIsMetadataDirty(false);
    setSaveError(null);
    setAutosaveError(null);
    setIsEditorReady(false);
    setEditorInstanceVersion((version) => version + 1);
    await refetchExistingPost();
  };

  const settingsContent = (
    <>
      <RichTextForm
        data={postData}
        onChange={handlePostDataChange}
        onUploadStateChange={setIsCoverUploading}
      />

      {isExistingPost ? (
        <div className="border-default-200 border-b px-6 py-4 md:px-10 lg:px-16">
          <RevisionHistoryDialog
            postId={Number(activeId)}
            isDisabled={isPending || hasContentSchemaError || isDirty}
            onRestored={handleRevisionRestored}
          />
        </div>
      ) : null}

      {isExistingPost ? (
        <div className="px-6 md:px-10 lg:px-16">
          <PublishingWorkflow
            postId={Number(activeId)}
            status={postData.status || "DRAFT"}
            scheduledAt={existingPost?.scheduledAt ?? undefined}
            isDisabled={isPending || hasContentSchemaError || isDirty}
            onStatusChange={(status) => setPostData((current) => ({ ...current, status }))}
            onCompleted={async () => {
              await refetchExistingPost();
            }}
          />
        </div>
      ) : null}

      <div className="p-6 pb-8 md:px-10 lg:px-16">
        <div className="flex w-full flex-col gap-4">
          {saveError && (
            <Alert status="danger">
              <Alert.Content>
                <Alert.Title>Save failed</Alert.Title>
                <Alert.Description>
                  <span>{saveError}</span>
                  <Button
                    className="mt-2"
                    size="sm"
                    variant="tertiary"
                    onPress={() => void handleSave(lastSaveStatusRef.current)}
                  >
                    Retry save
                  </Button>
                </Alert.Description>
              </Alert.Content>
            </Alert>
          )}
          {autosaveError && (
            <Alert status="warning">
              <Alert.Content>
                <Alert.Title>Server autosave unavailable</Alert.Title>
                <Alert.Description>
                  <span>{autosaveError} Local draft recovery remains available.</span>
                  <Button
                    className="mt-2"
                    size="sm"
                    variant="tertiary"
                    onPress={() => saveServerDraft(activeId, editorRef.current, true)}
                  >
                    Retry autosave
                  </Button>
                </Alert.Description>
              </Alert.Content>
            </Alert>
          )}
          {mediaIssues.length > 0 && (
            <Alert status="warning">
              <Alert.Content>
                <Alert.Title>Media needs attention</Alert.Title>
                <Alert.Description>
                  {mediaIssues.some(
                    (issue) => issue.code === "pending-upload" || issue.code === "missing-source"
                  )
                    ? "Finish, retry, or remove incomplete uploads before saving."
                    : "Add alternative text to every image before publishing."}
                </Alert.Description>
              </Alert.Content>
            </Alert>
          )}
          <div className="flex w-full items-center gap-3">
            <Button
              fullWidth
              variant="secondary"
              onPress={() => handleSave("DRAFT")}
              isDisabled={
                isCoverUploading ||
                hasContentSchemaError ||
                mediaIssues.some(
                  (issue) => issue.code === "pending-upload" || issue.code === "missing-source"
                )
              }
              isPending={isPending}
            >
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color="current" size="sm" />}
                  Save Draft
                </>
              )}
            </Button>
            <Button
              fullWidth
              variant="primary"
              onPress={() => handleSave("PUBLISHED")}
              isDisabled={isCoverUploading || hasContentSchemaError || mediaIssues.length > 0}
              isPending={isPending}
            >
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color="current" size="sm" />}
                  {postData.status === "PUBLISHED" ? "Update" : "Publish"}
                </>
              )}
            </Button>
          </div>
          {isAutosaving ? (
            <p aria-live="polite" className="text-muted text-xs">
              Saving a server draft…
            </p>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <>
      <Modal key={activeId}>
        <Modal.Backdrop
          isDismissable={false}
          isKeyboardDismissDisabled={isPending}
          isOpen={isOpen}
          onOpenChange={(nextIsOpen) => {
            if (!nextIsOpen) requestClose();
          }}
        >
          <Modal.Container size="cover">
            <Modal.Dialog
              aria-label={isExistingPost ? "Edit article" : "Create article"}
              className="relative flex h-full w-full flex-col overflow-hidden"
            >
              {/* Toggle Button */}
              <MotionButton
                isIconOnly
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 z-50 overflow-hidden backdrop-blur-xl"
                aria-label={showForm ? "Back to editor" : "Open settings"}
                isDisabled={isCoverUploading}
                onPress={() => setShowForm((prev) => !prev)}
                whileHover={{
                  scale: 1.06,
                }}
                whileTap={{
                  scale: 0.92,
                }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 22,
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={showForm ? "back" : "settings"}
                    initial={{
                      opacity: 0,
                      scale: 0.4,
                      rotate: -45,
                      filter: "blur(8px)",
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: 0,
                      filter: "blur(0px)",
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.4,
                      rotate: 45,
                      filter: "blur(8px)",
                    }}
                    transition={{
                      duration: 0.35,
                      ease: microEaseOut,
                    }}
                  >
                    <Icon
                      icon={showForm ? "gravity-ui:arrow-left" : "gravity-ui:sliders"}
                      className="size-4"
                    />
                  </motion.div>
                </AnimatePresence>
              </MotionButton>

              <Modal.Body className="relative min-h-0 flex-1 overflow-hidden p-0">
                {isFetching ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <Spinner size="lg" />
                  </div>
                ) : !existingContentIsEditable ? (
                  <div className="text-muted flex h-full w-full items-center justify-center p-8 text-center">
                    This article does not contain a valid Tiptap JSON document. It cannot be edited
                    with this editor.
                  </div>
                ) : (
                  <div className="flex h-full w-full overflow-hidden">
                    <motion.div
                      layout
                      initial={false}
                      animate={{ width: showForm && !isMobile ? "70%" : "100%" }}
                      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                      className="flex h-full min-w-0 flex-shrink-0 flex-col"
                    >
                      <div className="relative min-h-0 flex-1">
                        <RichText
                          key={`${activeId}-${existingPost?.updatedAt || "new"}-${editorInstanceVersion}`}
                          content={editorContent}
                          isDisabled={hasContentSchemaError}
                          showTableOfContents
                          onReady={(editor) => {
                            editorRef.current = editor;
                            initialEditorDocumentRef.current = editor.state.doc;
                            const content = editor.getJSON();
                            queueMicrotask(() => {
                              if (editor.isDestroyed) return;
                              setIsContentDirty(false);
                              setMediaIssues(getMediaValidationIssues(content));
                              setIsEditorReady(true);
                            });
                          }}
                          onContentError={(error) => {
                            setContentSchemaError({
                              activeId: activeId || "unknown",
                              message: error.message,
                            });
                          }}
                          onUpdate={(editor) => {
                            setSaveError(null);
                            saveDraft(
                              activeId,
                              editor,
                              postData,
                              Boolean(
                                isOpen && activeId && isPostDataReady && !hasContentSchemaError
                              )
                            );
                            saveServerDraft(
                              activeId,
                              editor,
                              Boolean(
                                isOpen && activeId && isPostDataReady && !hasContentSchemaError
                              )
                            );
                            updateMediaIssues(editor);

                            queueMicrotask(() => {
                              if (editor.isDestroyed) return;
                              setIsContentDirty(
                                initialEditorDocumentRef.current
                                  ? !initialEditorDocumentRef.current.eq(editor.state.doc)
                                  : true
                              );
                            });
                          }}
                        />
                      </div>
                      {hasContentSchemaError && (
                        <div className="bg-background/95 absolute inset-0 z-20 flex items-center justify-center p-8 text-center backdrop-blur-sm">
                          <div className="max-w-lg space-y-3">
                            <Icon
                              icon="solar:danger-triangle-linear"
                              className="text-danger mx-auto size-8"
                            />
                            <h2 className="text-foreground text-base font-semibold">
                              This document cannot be safely edited
                            </h2>
                            <p className="text-muted text-sm">
                              Its JSON content is incompatible with the active editor schema. No
                              changes can be saved, so unsupported content is not overwritten.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    <AnimatePresence initial={false}>
                      {showForm && !isMobile && (
                        <motion.div
                          key="settings"
                          initial={{ width: 0, opacity: 0, x: 20 }}
                          animate={{ width: "30%", opacity: 1, x: 0 }}
                          exit={{ width: 0, opacity: 0, x: 20 }}
                          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                          className="hidden h-full shrink-0 flex-col overflow-y-auto backdrop-blur-sm md:flex"
                        >
                          {settingsContent}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <Sheet
        isDetached
        isDismissable={!isPending}
        isOpen={showForm && isMobile}
        placement="right"
        onOpenChange={setShowForm}
      >
        <Sheet.Backdrop variant="blur">
          <Sheet.Content className="w-[min(100vw,32rem)] max-w-full">
            <Sheet.Dialog className="min-h-0">
              <Sheet.CloseTrigger isDisabled={isPending} />
              <Sheet.Header>
                <Sheet.Heading>Article settings</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body className="min-h-0 overflow-y-auto p-0">{settingsContent}</Sheet.Body>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isDiscardDialogOpen}
          onOpenChange={setIsDiscardDialogOpen}
          variant="blur"
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Discard unsaved changes?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">Your article changes have not been saved.</p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" size="sm" variant="tertiary">
                  Keep editing
                </Button>
                <Button size="sm" variant="danger" onPress={discardChanges}>
                  Discard changes
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isDraftRecoveryDialogOpen}
          onOpenChange={setIsDraftRecoveryDialogOpen}
          variant="blur"
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.Header>
                <AlertDialog.Icon status="warning" />
                <AlertDialog.Heading>Recover unsaved draft?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  A {recoverySource === "server" ? "server autosave" : "locally saved draft"} is
                  {recoverySource === "server"
                    ? " available for this article."
                    : " available from "}
                  {recoverySource !== "server" && recoveryDraft
                    ? new Date(recoveryDraft.savedAt).toLocaleString()
                    : null}
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button size="sm" variant="tertiary" onPress={discardLocalDraft}>
                  Discard draft
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onPress={restoreDraft}
                  isDisabled={!isEditorReady || hasContentSchemaError}
                >
                  Restore draft
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}
