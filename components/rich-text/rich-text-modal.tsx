"use client";

import { AlertDialog, Button, Modal, Spinner, TextArea, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Editor, JSONContent } from "@tiptap/react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { getApiErrorMessage } from "@/lib/api/errors";
import { getArticlePublicationProblems } from "./utils/publication-validation";
import { RichText } from "@/components/rich-text/rich-text";
import { ArticleSettingsPanel } from "@/components/rich-text/article-settings-panel";
import { MotionButton } from "@/components/ui";
import { closeRichText, selectRichTextState } from "@/lib/features";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { microEaseOut } from "@/lib/motion";
import {
  clearRichTextDraft,
  readRichTextDraft,
  sanitizePostData,
  type DraftPostData,
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
  useDiscardEditorDraftMutation,
  useSaveEditorDraftMutation,
  useCreatePostMutation,
  useGetEditorDraftQuery,
  useGetAdminPostByIdQuery,
  useUpdatePostMutation,
  type PostResponse,
  type PostEditorDraft,
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
    content: post.content || "",
    summary: post.summary || "",
    status: post.status,
    coverImage: post.coverImage || "",
    shaderPreset: post.shaderPreset,
    isFeatured: post.isFeatured,
    categoryId: post.category?.id,
    seriesId: post.series?.id,
    seriesOrder: post.seriesOrder ?? 0,
    tagIds: post.tags?.map((tag) => tag.id) || [],
  };
}

function serializePostData(data: Partial<PostRequest>): string {
  return JSON.stringify({
    content: data.content || "",
    title: data.title?.trim() || "",
    slug: data.slug?.trim() || "",
    summary: data.summary || "",
    status: data.status || "DRAFT",
    coverImage: data.coverImage || "",
    shaderPreset: data.shaderPreset || null,
    isFeatured: Boolean(data.isFeatured),
    categoryId: data.categoryId ?? null,
    seriesId: data.seriesId ?? null,
    seriesOrder: data.seriesOrder ?? 0,
    tagIds: [...(data.tagIds || [])].sort((a, b) => a - b),
  });
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
  return isOpen && activeId ? <ArticleEditorSession key={activeId} activeId={activeId} /> : null;
}

function ArticleEditorSession({ activeId }: { activeId: string }) {
  const dispatch = useAppDispatch();
  const t = useTranslations("EditorDraft");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const initialEditorDocumentRef = useRef<ProseMirrorNode | null>(null);
  const initialPostDataRef = useRef(serializePostData(EMPTY_POST_DATA));
  const [isContentDirty, setIsContentDirty] = useState(false);
  const [isMetadataDirty, setIsMetadataDirty] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [legacyDraft, setLegacyDraft] = useState<{
    content: ReturnType<typeof normalizeJSONContent>;
    postData: DraftPostData;
  } | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const draftRevisionRef = useRef<string | null>(null);
  const draftConflictRef = useRef(false);
  const [draftConflict, setDraftConflict] = useState(false);
  const [conflictReviewOpen, setConflictReviewOpen] = useState(false);
  const [reviewedDraft, setReviewedDraft] = useState<{ snapshot: PostEditorDraft | null } | null>(
    null
  );
  const [conflictLoading, setConflictLoading] = useState(false);
  const [conflictError, setConflictError] = useState(false);
  const savedDraftRef = useRef("");
  const draftRequestRef = useRef<Promise<boolean> | null>(null);
  const latestPostDataRef = useRef<DraftPostData>(EMPTY_POST_DATA);
  const [readyEditor, setReadyEditor] = useState<Editor | null>(null);
  const [editorInstanceVersion, setEditorInstanceVersion] = useState(0);
  const [isPostDataReady, setIsPostDataReady] = useState(false);
  const [mediaIssues, setMediaIssues] = useState(() =>
    getMediaValidationIssues(normalizeJSONContent(undefined))
  );
  const [contentSchemaError, setContentSchemaError] = useState<{
    activeId: string;
    message: string;
  } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSaveStatusRef = useRef<PostRequest["status"]>("DRAFT");

  // Form State
  const [postData, setPostData] = useState<Partial<PostRequest>>(EMPTY_POST_DATA);

  // API Mutations
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const [saveEditorDraft] = useSaveEditorDraftMutation();
  const [discardEditorDraft] = useDiscardEditorDraftMutation();
  const isExistingPost = /^[1-9]\d*$/.test(activeId);
  const supportsDraft = isExistingPost || activeId === "new";
  const isPending = isCreating || isUpdating || isFinalizing;
  const hasContentSchemaError = contentSchemaError?.activeId === activeId;

  // Fetch existing post data if activeId is a numeric string (existing ID)
  const {
    data: existingPost,
    isLoading: isFetching,
    refetch: refetchExistingPost,
  } = useGetAdminPostByIdQuery(Number(activeId), {
    skip: !isExistingPost,
  });
  const serverDraft = useGetEditorDraftQuery(activeId, {
    skip: !supportsDraft,
    refetchOnMountOrArgChange: true,
  });
  const existingContentIsEditable = useMemo(
    () =>
      !existingPost ||
      (existingPost.contentType === "JSON" && Boolean(parseJSONContent(existingPost.content))),
    [existingPost]
  );

  const markDraftConflict = (error: unknown) => {
    if (!error || typeof error !== "object" || !("status" in error) || error.status !== 409) {
      return false;
    }
    draftConflictRef.current = true;
    setDraftConflict(true);
    setReviewedDraft(null);
    return true;
  };

  const snapshotEditor = useCallback((editor: Editor, content: JSONContent = editor.getJSON()) => {
    const normalized = normalizeRichTextDocument(removeTemporaryMediaAttributes(content));
    return {
      content: normalized,
      postData: { ...latestPostDataRef.current, content: JSON.stringify(normalized) },
    };
  }, []);

  async function syncDraft(reviewed?: { snapshot: PostEditorDraft | null }) {
    if (!supportsDraft || !draftReady || hasContentSchemaError || !existingContentIsEditable)
      return false;
    while (draftRequestRef.current) await draftRequestRef.current;
    if (draftConflictRef.current && !reviewed) return false;

    const editor = editorRef.current;
    if (!editor || editor.isDestroyed) return false;
    const document = editor.state.doc;
    const content = editor.getJSON();
    if (hasPendingMediaUploads(content)) {
      setDraftState("error");
      return false;
    }

    const currentData = latestPostDataRef.current;
    const snapshot = snapshotEditor(editor, content);
    const postData = sanitizePostData(snapshot.postData) ?? {};
    const fingerprint = serializePostData(postData);
    if (!reviewed && fingerprint === savedDraftRef.current) {
      setDraftState(draftRevisionRef.current ? "saved" : "idle");
      return true;
    }

    setDraftState("saving");
    const request = saveEditorDraft({
      identifier: activeId,
      content: snapshot.content,
      postData,
      revision: reviewed ? (reviewed.snapshot?.revision ?? null) : draftRevisionRef.current,
    })
      .unwrap()
      .then(
        (draft) => {
          draftRevisionRef.current = draft.revision;
          savedDraftRef.current = fingerprint;
          draftConflictRef.current = false;
          setDraftConflict(false);
          clearRichTextDraft(activeId);
          if (
            !editor.isDestroyed &&
            editor.state.doc === document &&
            latestPostDataRef.current === currentData
          ) {
            setDraftState("saved");
          }
          return true;
        },
        (error) => {
          markDraftConflict(error);
          setDraftState("error");
          return false;
        }
      );
    draftRequestRef.current = request;
    const result = await request;
    draftRequestRef.current = null;
    return result;
  }

  const scheduleDraft = useDebouncedCallback(() => void syncDraft(), 900);
  const scheduleAutosave = () => {
    if (
      !supportsDraft ||
      !draftReady ||
      isFinalizing ||
      hasContentSchemaError ||
      draftConflictRef.current
    )
      return;
    setDraftState("saving");
    scheduleDraft();
  };

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

  const editorContent = useMemo(
    () => normalizeJSONContent(postData.content || existingPost?.content),
    [existingPost?.content, postData.content]
  );
  const applyDraft = useCallback(
    (content: ReturnType<typeof normalizeJSONContent>, data: Partial<PostRequest>) => {
      const editor = editorRef.current;
      if (!editor) return false;
      try {
        editor.commands.setContent(content, { emitUpdate: false, errorOnInvalidContent: true });
      } catch {
        setContentSchemaError({ activeId, message: t("unreadable") });
        return false;
      }
      latestPostDataRef.current = data;
      setPostData(data);
      setIsContentDirty(!initialEditorDocumentRef.current?.eq(editor.state.doc));
      setIsMetadataDirty(serializePostData(data) !== initialPostDataRef.current);
      setMediaIssues(getMediaValidationIssues(editor.getJSON()));
      return true;
    },
    [activeId, t]
  );

  useEffect(() => {
    if (!readyEditor || !isPostDataReady || draftReady || legacyDraft) return;
    if (supportsDraft && (serverDraft.isFetching || !serverDraft.isSuccess)) return;
    const editor = readyEditor;
    if (editor.isDestroyed) return;

    const current = serverDraft.currentData;
    const storedContent = current
      ? (parseJSONContent(current.postData.content) ?? parseJSONContent(current.content))
      : null;
    const initial = latestPostDataRef.current;
    const data = current?.revision
      ? { ...EMPTY_POST_DATA, ...sanitizePostData(current.postData) }
      : initial;
    const local = current?.revision ? null : readRichTextDraft(activeId);
    const baselineSnapshot = snapshotEditor(editor);
    const baseline = serializePostData(baselineSnapshot.postData);

    const timer = window.setTimeout(() => {
      if (editor.isDestroyed) return;
      savedDraftRef.current = baseline;
      if (current?.revision) {
        draftRevisionRef.current = current.revision;
        if (!storedContent || !applyDraft(storedContent, data)) {
          setContentSchemaError({ activeId, message: t("unreadable") });
          setDraftState("error");
          setDraftReady(true);
          return;
        }
        savedDraftRef.current = serializePostData(snapshotEditor(editor).postData);
        clearRichTextDraft(activeId);
        setDraftState("saved");
      } else if (supportsDraft && (local || storedContent)) {
        setLegacyDraft(
          local ?? (storedContent ? { content: storedContent, postData: data } : null)
        );
        return;
      }
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    activeId,
    applyDraft,
    draftReady,
    readyEditor,
    isPostDataReady,
    legacyDraft,
    serverDraft.currentData,
    serverDraft.isFetching,
    serverDraft.isSuccess,
    snapshotEditor,
    supportsDraft,
    t,
  ]);

  // Initialize form with existing post data
  useEffect(() => {
    const nextPostData = existingPost
      ? toPostData(existingPost)
      : !isExistingPost
        ? EMPTY_POST_DATA
        : null;
    if (!nextPostData) return;

    initialPostDataRef.current = serializePostData(nextPostData);
    const timer = window.setTimeout(() => {
      latestPostDataRef.current = nextPostData;
      setPostData(nextPostData);
      setIsMetadataDirty(false);
      setIsPostDataReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [existingPost, isExistingPost]);

  const isDirty = isContentDirty || isMetadataDirty;

  const handlePostDataChange = (nextPostData: Partial<PostRequest>) => {
    latestPostDataRef.current = nextPostData;
    setPostData(nextPostData);
    setSaveError(null);
    setIsMetadataDirty(serializePostData(nextPostData) !== initialPostDataRef.current);
    scheduleAutosave();
  };

  useEffect(() => {
    return () => {
      scheduleDraft.cancel();
      updateMediaIssues.cancel();
    };
  }, [scheduleDraft, updateMediaIssues]);

  useEffect(() => {
    if (draftState !== "saving" && draftState !== "error" && !draftConflict) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const online = () => scheduleDraft();
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("online", online);
    };
  }, [draftConflict, draftState, scheduleDraft]);

  const closeEditor = () => {
    scheduleDraft.cancel();
    dispatch(closeRichText());
    setSettingsOpen(false);
    setIsDiscardDialogOpen(false);
    setConfirmClose(false);
    setSaveError(null);
  };

  const requestClose = async () => {
    if (isPending) return;
    if (!supportsDraft && isDirty) {
      setIsDiscardDialogOpen(true);
      return;
    }
    if (!draftReady || !supportsDraft || draftState === "idle" || draftState === "saved") {
      closeEditor();
      return;
    }
    setIsFinalizing(true);
    scheduleDraft.cancel();
    try {
      if (await syncDraft()) closeEditor();
      else setConfirmClose(true);
    } finally {
      setIsFinalizing(false);
    }
  };

  const discardChanges = async () => {
    if (isPending || draftConflictRef.current) return;
    setIsFinalizing(true);
    scheduleDraft.cancel();
    try {
      await draftRequestRef.current;
      if (supportsDraft) {
        await discardEditorDraft({
          identifier: activeId,
          revision: draftRevisionRef.current,
        }).unwrap();
      }
      clearRichTextDraft(activeId);
      closeEditor();
    } catch {
      toast.danger(t("discardFailed"));
    } finally {
      setIsFinalizing(false);
    }
  };

  const resumeLegacyDraft = () => {
    if (!legacyDraft || !applyDraft(legacyDraft.content, legacyDraft.postData)) return;
    setLegacyDraft(null);
    setDraftReady(true);
    setDraftState("saving");
    scheduleDraft();
  };

  const reviewServerDraft = async () => {
    setConflictReviewOpen(true);
    setReviewedDraft(null);
    setConflictError(false);
    setConflictLoading(true);
    try {
      const snapshot = await serverDraft.refetch().unwrap();
      setReviewedDraft({ snapshot });
    } catch {
      setConflictError(true);
    } finally {
      setConflictLoading(false);
    }
  };

  const copyLocalDraft = async () => {
    const editor = editorRef.current;
    if (!editor || editor.isDestroyed) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshotEditor(editor), null, 2));
      toast.success(t("localDraftCopied"));
    } catch {
      toast.danger(t("copyDraftFailed"));
    }
  };

  const saveReviewedDraft = async () => {
    if (!reviewedDraft || isPending) return;
    setIsFinalizing(true);
    try {
      if (await syncDraft(reviewedDraft)) setConflictReviewOpen(false);
      else setConflictError(true);
    } finally {
      setIsFinalizing(false);
    }
  };

  const publicationError = (content: string | undefined) =>
    getArticlePublicationProblems(content).length ? t("publicationProblems") : null;

  const validatePublication = () => {
    const editor = editorRef.current;
    return publicationError(
      editor && !editor.isDestroyed
        ? snapshotEditor(editor).postData.content
        : latestPostDataRef.current.content
    );
  };

  const handleSave = async (statusOverride?: PostRequest["status"]) => {
    if (draftConflictRef.current) {
      void reviewServerDraft();
      return;
    }
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

    const editor = editorRef.current;
    if (!editor || editor.isDestroyed) {
      toast.warning("The editor is still loading. Try saving again in a moment.");
      return;
    }

    const content = editor.getJSON();
    const nextMediaIssues = getMediaValidationIssues(content);
    const hasUnresolvedUpload = nextMediaIssues.some(
      (issue) => issue.code === "pending-upload" || issue.code === "missing-source"
    );
    if (hasUnresolvedUpload) {
      toast.warning("Finish, retry, or remove media uploads before saving.");
      return;
    }

    const title = postData.title?.trim();
    const slug = postData.slug?.trim();
    if (!title || !slug) {
      toast.warning("Title and slug are required before saving.");
      return;
    }

    const { postData: draftData } = snapshotEditor(editor, content);
    delete draftData.translations;
    const payload: PostRequest = {
      ...draftData,
      title,
      slug,
      contentType: "JSON",
      status: requestedStatus,
    };

    if (requestedStatus === "PUBLISHED") {
      const error = publicationError(payload.content);
      if (error) {
        toast.warning(error);
        return;
      }
    }

    setIsFinalizing(true);
    scheduleDraft.cancel();
    try {
      await draftRequestRef.current;
      if (draftConflictRef.current) return;
      const draftRevision = draftRevisionRef.current ?? "none";
      if (isExistingPost) {
        await updatePost({ id: Number(activeId), body: payload, draftRevision }).unwrap();
      } else {
        await createPost({ body: payload, draftRevision }).unwrap();
      }
      clearRichTextDraft(activeId);
      closeEditor();
    } catch (error) {
      if (!markDraftConflict(error)) {
        setSaveError(getApiErrorMessage(error, "The article could not be saved. Try again."));
        scheduleAutosave();
      } else {
        setDraftState("error");
      }
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleRevisionRestored = async () => {
    clearRichTextDraft(activeId);
    scheduleDraft.cancel();
    setIsContentDirty(false);
    setIsMetadataDirty(false);
    setSaveError(null);
    setReadyEditor(null);
    setEditorInstanceVersion((version) => version + 1);
    await refetchExistingPost();
  };

  return (
    <>
      <Modal>
        <Modal.Backdrop
          isDismissable={false}
          isKeyboardDismissDisabled={isPending}
          isOpen
          onOpenChange={(nextIsOpen) => {
            if (!nextIsOpen) void requestClose();
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
                aria-label={settingsOpen ? "Back to editor" : "Open settings"}
                onPress={() => setSettingsOpen((open) => !open)}
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
                    key={settingsOpen ? "back" : "settings"}
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
                      icon={settingsOpen ? "gravity-ui:arrow-left" : "gravity-ui:sliders"}
                      className="size-4"
                    />
                  </motion.div>
                </AnimatePresence>
              </MotionButton>

              <Modal.Body className="relative min-h-0 flex-1 overflow-hidden">
                {serverDraft.isError && !draftReady ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3">
                    <p role="alert">{t("loadFailed")}</p>
                    <Button onPress={() => void serverDraft.refetch()} size="sm">
                      {t("retry")}
                    </Button>
                  </div>
                ) : isFetching || (supportsDraft && !draftReady && serverDraft.isFetching) ? (
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
                      animate={{ width: "100%" }}
                      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                      className={`flex h-full min-w-0 flex-shrink-0 flex-col ${settingsOpen ? "invisible" : ""}`}
                    >
                      <div className="relative min-h-0 flex-1">
                        <RichText
                          key={`${activeId}-${existingPost?.updatedAt || "new"}-${editorInstanceVersion}`}
                          content={editorContent}
                          isDisabled={
                            hasContentSchemaError || (supportsDraft && !draftReady) || isPending
                          }
                          showTableOfContents
                          onReady={(editor) => {
                            editorRef.current = editor;
                            initialEditorDocumentRef.current = editor.state.doc;
                            const content = editor.getJSON();
                            queueMicrotask(() => {
                              if (editor.isDestroyed) return;
                              setIsContentDirty(false);
                              setMediaIssues(getMediaValidationIssues(content));
                              setReadyEditor(editor);
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
                            scheduleAutosave();
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
                    <ArticleSettingsPanel
                      data={postData}
                      isDisabled={
                        isPending || hasContentSchemaError || (supportsDraft && !draftReady)
                      }
                      isWorkflowDisabled={
                        isPending ||
                        hasContentSchemaError ||
                        isDirty ||
                        draftState !== "idle" ||
                        draftConflict
                      }
                      isExistingPost={isExistingPost}
                      isOpen={settingsOpen}
                      isPending={isPending}
                      mediaWarning={
                        mediaIssues.length === 0
                          ? null
                          : mediaIssues.some(
                                (issue) =>
                                  issue.code === "pending-upload" || issue.code === "missing-source"
                              )
                            ? "Finish, retry, or remove incomplete uploads before saving."
                            : "Add alternative text to every image before publishing."
                      }
                      postId={isExistingPost ? Number(activeId) : undefined}
                      saveError={saveError}
                      scheduledAt={existingPost?.scheduledAt ?? undefined}
                      onChange={handlePostDataChange}
                      onRetrySave={() => void handleSave(lastSaveStatusRef.current)}
                      onSave={(status) => void handleSave(status)}
                      onWorkflowCompleted={handleRevisionRestored}
                      validatePublication={validatePublication}
                    />
                  </div>
                )}
              </Modal.Body>
              {supportsDraft ? (
                <Modal.Footer className="flex-wrap items-center justify-between">
                  <p role="status" className="text-muted text-sm">
                    {draftConflict
                      ? t("conflict")
                      : draftReady && draftState !== "idle"
                        ? t(draftState)
                        : null}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {draftConflict ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => void reviewServerDraft()}
                      >
                        {t("reviewServerDraft")}
                      </Button>
                    ) : draftState === "error" ? (
                      <Button
                        size="sm"
                        variant="tertiary"
                        isDisabled={isPending}
                        onPress={() => void syncDraft()}
                      >
                        {t("retry")}
                      </Button>
                    ) : null}
                    {draftReady && draftState !== "idle" && !draftConflict ? (
                      <Button
                        size="sm"
                        variant="tertiary"
                        isDisabled={isPending}
                        onPress={() => setIsDiscardDialogOpen(true)}
                      >
                        {t("discard")}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="secondary"
                      isDisabled={isPending}
                      onPress={() => void requestClose()}
                    >
                      {t("close")}
                    </Button>
                  </div>
                </Modal.Footer>
              ) : null}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <Modal>
        <Modal.Backdrop isOpen={conflictReviewOpen} onOpenChange={setConflictReviewOpen}>
          <Modal.Container size="lg">
            <Modal.Dialog aria-label={t("reviewServerDraft")}>
              <Modal.Header>
                <Modal.Heading>{t("reviewServerDraft")}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4">
                <p className="text-muted">{t("conflictDescription")}</p>
                {conflictLoading && <Spinner aria-label={t("reviewServerDraft")} />}
                {conflictError && (
                  <Button variant="tertiary" onPress={() => void reviewServerDraft()}>
                    {t("refreshServerDraft")}
                  </Button>
                )}
                {reviewedDraft && (
                  <TextArea
                    aria-label={t("serverDraftContents")}
                    rows={10}
                    fullWidth
                    readOnly
                    value={
                      reviewedDraft.snapshot
                        ? JSON.stringify(reviewedDraft.snapshot, null, 2)
                        : t("noServerDraft")
                    }
                  />
                )}
              </Modal.Body>
              <Modal.Footer className="flex-wrap">
                <Button slot="close" variant="tertiary">
                  {t("keepEditing")}
                </Button>
                <Button variant="secondary" onPress={() => void copyLocalDraft()}>
                  {t("copyLocalDraft")}
                </Button>
                <Button
                  variant="primary"
                  isDisabled={!reviewedDraft || conflictError}
                  isPending={isFinalizing}
                  onPress={() => void saveReviewedDraft()}
                >
                  {t("saveLocalVersion")}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isDiscardDialogOpen || confirmClose || Boolean(legacyDraft)}
          onOpenChange={(open) => {
            if (!open && !legacyDraft && !isFinalizing) {
              setIsDiscardDialogOpen(false);
              setConfirmClose(false);
            }
          }}
          variant="blur"
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>
                  {t(
                    confirmClose
                      ? "closeUnsavedHeading"
                      : legacyDraft
                        ? "resumeHeading"
                        : "discardHeading"
                  )}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  {t(
                    confirmClose
                      ? "closeUnsavedDescription"
                      : legacyDraft
                        ? "resumeDescription"
                        : "discardDescription"
                  )}
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                {legacyDraft ? (
                  <Button
                    size="sm"
                    variant="primary"
                    isDisabled={isPending}
                    onPress={resumeLegacyDraft}
                  >
                    {t("resume")}
                  </Button>
                ) : (
                  <Button slot="close" size="sm" variant="tertiary" isDisabled={isPending}>
                    {t("keepEditing")}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  isPending={isFinalizing}
                  onPress={confirmClose ? closeEditor : () => void discardChanges()}
                >
                  {t(confirmClose ? "closeUnsaved" : "discard")}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}
