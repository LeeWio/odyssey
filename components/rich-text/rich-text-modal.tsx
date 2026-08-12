"use client";

import { AlertDialog, Button, Modal, Spinner, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Editor } from "@tiptap/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { RichText } from "@/components/rich-text/rich-text";
import { RichTextForm } from "@/components/rich-text/rich-text-form";
import { MotionButton } from "@/components/ui";
import { closeRichText, selectRichTextState } from "@/lib/features";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  clearRichTextDraft,
  type RichTextDraft,
  readRichTextDraft,
  saveRichTextDraft,
} from "./utils/editor-draft";
import {
  hasPendingImageUploads,
  normalizeJSONContent,
  normalizeRichTextDocument,
  parseJSONContent,
  removeTemporaryImageAttributes,
} from "./utils/document-normalizer";
import {
  useCreatePostMutation,
  useGetAdminPostByIdQuery,
  useUpdatePostMutation,
  type PostResponse,
  type PostRequest,
} from "@/features/blog";

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

export function RichTextModal() {
  const { isOpen, activeId } = useAppSelector(selectRichTextState);
  const dispatch = useAppDispatch();

  const [showForm, setShowForm] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const initialEditorContentRef = useRef<string | null>(null);
  const initialPostDataRef = useRef(serializePostData(EMPTY_POST_DATA));
  const [isContentDirty, setIsContentDirty] = useState(false);
  const [isMetadataDirty, setIsMetadataDirty] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isDraftRecoveryDialogOpen, setIsDraftRecoveryDialogOpen] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState<RichTextDraft | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isPostDataReady, setIsPostDataReady] = useState(false);
  const [draftRevision, setDraftRevision] = useState(0);
  const [contentSchemaError, setContentSchemaError] = useState<{
    activeId: string;
    message: string;
  } | null>(null);

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

  const isPending = isCreating || isUpdating;
  const hasContentSchemaError = contentSchemaError?.activeId === activeId;

  // Fetch existing post data if activeId is a numeric string (existing ID)
  const isExistingPost = activeId && !isNaN(Number(activeId));
  const { data: existingPost, isLoading: isFetching } = useGetAdminPostByIdQuery(Number(activeId), {
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

  useEffect(() => {
    editorRef.current = null;
    initialEditorContentRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsEditorReady(false);
    setIsPostDataReady(false);
    setIsContentDirty(false);
    setIsMetadataDirty(false);
    setIsDraftRecoveryDialogOpen(false);
    setRecoveryDraft(null);
    setContentSchemaError(null);
  }, [activeId, isOpen]);

  useEffect(() => {
    if (!isOpen || !activeId || !isPostDataReady || !existingContentIsEditable) return;

    const draft = readRichTextDraft(activeId);
    const timer = window.setTimeout(() => {
      setRecoveryDraft(draft);
      setIsDraftRecoveryDialogOpen(Boolean(draft));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeId, existingContentIsEditable, isOpen, isPostDataReady]);

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
    setIsMetadataDirty(serializePostData(nextPostData) !== initialPostDataRef.current);
    setDraftRevision((revision) => revision + 1);
  };

  useEffect(() => {
    if (
      !isOpen ||
      !activeId ||
      !isDirty ||
      hasContentSchemaError ||
      !isPostDataReady ||
      !editorRef.current
    ) {
      return;
    }

    const content = editorRef.current.getJSON();
    const timer = window.setTimeout(() => {
      saveRichTextDraft(activeId, content, postData);
    }, 750);

    return () => window.clearTimeout(timer);
  }, [activeId, draftRevision, hasContentSchemaError, isDirty, isOpen, isPostDataReady, postData]);

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
    dispatch(closeRichText());
    setShowForm(false);
    setIsDiscardDialogOpen(false);
    setIsDraftRecoveryDialogOpen(false);
    setRecoveryDraft(null);
    setContentSchemaError(null);
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

    const restoredContent = editorRef.current.getJSON();
    const restoredPostData = recoveryDraft.postData;
    setPostData(restoredPostData);
    setIsContentDirty(JSON.stringify(restoredContent) !== initialEditorContentRef.current);
    setIsMetadataDirty(serializePostData(restoredPostData) !== initialPostDataRef.current);
    setDraftRevision((revision) => revision + 1);
    setRecoveryDraft(null);
    setIsDraftRecoveryDialogOpen(false);
  };

  const handleSave = async (statusOverride?: PostRequest["status"]) => {
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
      content: JSON.stringify(content),
      contentType: "JSON",
      status: statusOverride || postData.status || "DRAFT",
    };

    try {
      if (isExistingPost) {
        await updatePost({ id: Number(activeId), body: payload }).unwrap();
      } else {
        await createPost(payload).unwrap();
      }
      clearRichTextDraft(activeId);
      closeEditor();
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  return (
    <>
      <Modal key={activeId}>
        <Modal.Backdrop
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
                      ease: [0.22, 1, 0.36, 1],
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
                      animate={{ width: showForm ? "70%" : "100%" }}
                      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                      className="h-full min-w-0 flex-shrink-0"
                    >
                      <RichText
                        key={`${activeId}-${existingPost?.updatedAt || "new"}`}
                        content={editorContent}
                        isDisabled={hasContentSchemaError}
                        showTableOfContents
                        onReady={(editor) => {
                          editorRef.current = editor;
                          const content = JSON.stringify(editor.getJSON());
                          initialEditorContentRef.current = content;
                          setIsContentDirty(false);
                          setIsEditorReady(true);
                        }}
                        onContentError={(error) => {
                          setContentSchemaError({
                            activeId: activeId || "unknown",
                            message: error.message,
                          });
                        }}
                        onUpdate={(editor) => {
                          setIsContentDirty(
                            JSON.stringify(editor.getJSON()) !== initialEditorContentRef.current
                          );
                          setDraftRevision((revision) => revision + 1);
                        }}
                      />
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
                      {showForm && (
                        <motion.div
                          key="settings"
                          initial={{ width: 0, opacity: 0, x: 20 }}
                          animate={{ width: "30%", opacity: 1, x: 0 }}
                          exit={{ width: 0, opacity: 0, x: 20 }}
                          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                          className="flex h-full shrink-0 flex-col overflow-hidden backdrop-blur-sm"
                        >
                          <RichTextForm data={postData} onChange={handlePostDataChange} />

                          <div className="min-w-[320px] p-6 pb-8 md:px-10 lg:px-16">
                            <div className="flex w-full flex-col gap-4">
                              <div className="flex w-full items-center gap-3">
                                <Button
                                  fullWidth
                                  variant="secondary"
                                  onPress={() => handleSave("DRAFT")}
                                  isDisabled={hasContentSchemaError}
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
                                  isDisabled={hasContentSchemaError}
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
                            </div>
                          </div>
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
                  A locally saved draft is available from{" "}
                  {recoveryDraft
                    ? new Date(recoveryDraft.savedAt).toLocaleString()
                    : "this browser"}
                  .
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
