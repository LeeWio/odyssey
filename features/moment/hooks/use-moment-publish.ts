import { useEffect, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { toast } from "@heroui/react";
import {
  useCreateMomentMutation,
  useUpdateMomentMutation,
  type MomentImageResponse,
  type MomentResponse,
} from "@/lib/features/moment";
import type { FileResponse } from "@/lib/features/file";
import { useUploadFileMutation } from "@/lib/features/file/file-api";
import { MOMENT_CHARACTER_LIMIT } from "../utils/character-count";
import { MOMENT_TOPIC_LIMIT } from "../utils/topic-slug";
import { parseMomentContent, isDocumentEmpty } from "../utils/content-parser";
import { momentContentSchema } from "../utils/content-schema";
import {
  MOMENT_MAX_IMAGES,
  defaultMomentAltText,
  validateMomentImageFile,
} from "../utils/media-limits";

export type PublisherMediaStatus = "uploading" | "complete" | "failed";

export type PublisherMediaItem =
  | {
      id: string;
      kind: "existing";
      preview: string;
      fileId: number;
      altText: string;
      existing: MomentImageResponse;
      status: "complete";
    }
  | {
      id: string;
      kind: "local";
      preview: string;
      file: File;
      altText: string;
      status: PublisherMediaStatus;
      progress: number;
      fileId?: number;
      response?: FileResponse;
      errorMessage?: string;
    };

function toExistingMedia(image: MomentImageResponse): PublisherMediaItem {
  return {
    id: `existing-${image.id}`,
    kind: "existing",
    preview: image.thumbnailUrl || image.fileUrl,
    fileId: image.fileId,
    altText: image.altText,
    existing: image,
    status: "complete",
  };
}

function createLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `local-${crypto.randomUUID()}`;
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useMomentPublish = (onSuccess?: () => void, initialMoment?: MomentResponse) => {
  const initialContent = initialMoment ? parseMomentContent(initialMoment.content) : undefined;
  const [mediaItems, setMediaItems] = useState<PublisherMediaItem[]>(
    () => initialMoment?.images.map(toExistingMedia) ?? []
  );

  const [editorValue, setEditorValue] = useState<JSONContent | undefined>(initialContent);
  const [charCount, setCharCount] = useState(() => {
    if (!initialContent) return 0;
    const doc = momentContentSchema.nodeFromJSON(initialContent);
    // Match Tiptap CharacterCount's default textSize mode, including leaf separators.
    return doc.textBetween(0, doc.content.size, undefined, " ").length;
  });
  const [isEmpty, setIsEmpty] = useState(isDocumentEmpty(initialContent));
  const [topics, setTopics] = useState<string[]>(
    initialMoment?.topics.map((topic) => topic.slug) ?? []
  );
  const [visibility, setVisibility] = useState(initialMoment?.visibility ?? "public");
  const [shareToX, setShareToX] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [attachedStockSymbol, setAttachedStockSymbol] = useState<string | null>(
    initialMoment?.stockSymbol ?? null
  );

  const [createMoment] = useCreateMomentMutation();
  const [updateMoment] = useUpdateMomentMutation();
  const [uploadFile] = useUploadFileMutation();
  const activeUploads = useRef(new Map<string, { abort: () => void }>());
  const progressTimers = useRef(new Map<string, number>());

  const clearProgressPulse = (id: string) => {
    const timer = progressTimers.current.get(id);
    if (timer !== undefined) {
      window.clearInterval(timer);
      progressTimers.current.delete(id);
    }
  };

  const startProgressPulse = (id: string) => {
    clearProgressPulse(id);
    if (typeof window === "undefined") return;
    const timer = window.setInterval(() => {
      setMediaItems((prev) =>
        prev.map((item) => {
          if (item.id !== id || item.kind !== "local" || item.status !== "uploading") return item;
          if (item.progress >= 92) return item;
          return {
            ...item,
            progress: Math.min(item.progress + 6 + Math.random() * 10, 92),
          };
        })
      );
    }, 350);
    progressTimers.current.set(id, timer);
  };

  useEffect(() => {
    const uploads = activeUploads.current;
    const timers = progressTimers.current;
    return () => {
      uploads.forEach(({ abort }) => abort());
      uploads.clear();
      timers.forEach((timer) => window.clearInterval(timer));
      timers.clear();
    };
  }, []);

  const runUpload = (id: string, file: File) => {
    activeUploads.current.get(id)?.abort();
    const request = uploadFile(file);
    activeUploads.current.set(id, { abort: () => request.abort() });
    startProgressPulse(id);

    void (async () => {
      try {
        const response = await request.unwrap();
        clearProgressPulse(id);
        if (response.id === undefined) {
          const errorMessage = "Uploaded file is missing an ID.";
          setMediaItems((prev) =>
            prev.map((item) =>
              item.id === id && item.kind === "local"
                ? {
                    ...item,
                    status: "failed",
                    progress: 0,
                    errorMessage,
                    response: undefined,
                    fileId: undefined,
                  }
                : item
            )
          );
          toast.danger(errorMessage);
          return;
        }

        setMediaItems((prev) =>
          prev.map((item) =>
            item.id === id && item.kind === "local"
              ? {
                  ...item,
                  status: "complete",
                  progress: 100,
                  response,
                  fileId: response.id,
                  errorMessage: undefined,
                }
              : item
          )
        );
      } catch {
        clearProgressPulse(id);
        if (!activeUploads.current.has(id)) return;
        setMediaItems((prev) =>
          prev.map((item) =>
            item.id === id && item.kind === "local"
              ? {
                  ...item,
                  status: "failed",
                  progress: 0,
                  errorMessage: "Upload failed. Check the connection and try again.",
                }
              : item
          )
        );
        toast.danger(`Couldn't upload ${file.name}. You can retry it.`);
      } finally {
        activeUploads.current.delete(id);
      }
    })();
  };

  const startUpload = (id: string, file: File) => {
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === id && item.kind === "local"
          ? {
              ...item,
              status: "uploading",
              progress: 8,
              errorMessage: undefined,
              fileId: undefined,
              response: undefined,
            }
          : item
      )
    );
    runUpload(id, file);
  };

  const appendFiles = (files: File[]) => {
    const remaining = MOMENT_MAX_IMAGES - mediaItems.length;
    if (remaining <= 0) {
      toast.warning("A moment can contain up to 9 images.");
      return;
    }

    const accepted: Extract<PublisherMediaItem, { kind: "local" }>[] = [];
    for (const file of files) {
      if (accepted.length >= remaining) {
        toast.warning(`Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added.`);
        break;
      }
      const error = validateMomentImageFile(file);
      if (error) {
        toast.danger(error);
        continue;
      }
      accepted.push({
        id: createLocalId(),
        kind: "local",
        preview: URL.createObjectURL(file),
        file,
        altText: defaultMomentAltText(file.name),
        status: "uploading",
        progress: 8,
      });
    }

    if (accepted.length === 0) return;
    setMediaItems((prev) => [...prev, ...accepted]);
    accepted.forEach((item) => runUpload(item.id, item.file));
  };

  const handleSelectFiles = (fileList: FileList) => {
    appendFiles(Array.from(fileList));
  };

  const handleDrop = async (e: {
    items: Iterable<{ kind: string; getFile?: () => Promise<File | null> }>;
  }) => {
    const dropped: File[] = [];
    for (const item of Array.from(e.items)) {
      if (item.kind === "file" && item.getFile) {
        const file = await item.getFile();
        if (file) dropped.push(file);
      }
    }
    appendFiles(dropped);
  };

  const removeMedia = (id: string) => {
    activeUploads.current.get(id)?.abort();
    activeUploads.current.delete(id);
    clearProgressPulse(id);
    setMediaItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.kind === "local") {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const updateMediaAlt = (id: string, altText: string) => {
    setMediaItems((prev) => prev.map((item) => (item.id === id ? { ...item, altText } : item)));
  };

  const retryMedia = (id: string) => {
    const target = mediaItems.find((item) => item.id === id);
    if (!target || target.kind !== "local") return;
    startUpload(target.id, target.file);
  };

  const handleReset = () => {
    activeUploads.current.forEach(({ abort }) => abort());
    activeUploads.current.clear();
    progressTimers.current.forEach((timer) => window.clearInterval(timer));
    progressTimers.current.clear();
    mediaItems.forEach((item) => {
      if (item.kind === "local") URL.revokeObjectURL(item.preview);
    });
    setEditorValue(undefined);
    setCharCount(0);
    setIsEmpty(true);
    setMediaItems([]);
    setTopics([]);
    setAttachedStockSymbol(null);
    setVisibility("public");
    setShareToX(false);
    setIsSubmitting(false);
  };

  const hasIncompleteUploads = mediaItems.some((item) => item.status !== "complete");
  const hasMissingAlt = mediaItems.some((item) => !item.altText.trim());
  const submitBlockReason = (() => {
    if (isSubmitting) return null;
    if (hasIncompleteUploads) return "Wait for image uploads to finish";
    if (hasMissingAlt) return "Add alt text for every image";
    if (charCount > MOMENT_CHARACTER_LIMIT) return "Character limit exceeded";
    if (isEmpty && mediaItems.length === 0 && !attachedStockSymbol) {
      return "Write something or add media first";
    }
    return null;
  })();

  const publishMoment = async () => {
    if (
      (isEmpty && mediaItems.length === 0 && !attachedStockSymbol) ||
      charCount > MOMENT_CHARACTER_LIMIT ||
      isSubmitting ||
      hasIncompleteUploads ||
      hasMissingAlt
    )
      return;
    setIsSubmitting(true);
    try {
      const images = mediaItems.map((item) => {
        if (item.kind === "existing") {
          return { fileId: item.fileId, altText: item.altText.trim() };
        }
        if (!item.fileId) {
          throw new Error("Uploaded file is missing an ID.");
        }
        return { fileId: item.fileId, altText: item.altText.trim() };
      });

      let finalContent = "";
      if (editorValue) {
        finalContent = JSON.stringify(editorValue);
      } else if (attachedStockSymbol) {
        const fallbackEditor: JSONContent = {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Shared stock coordinates:",
                },
              ],
            },
          ],
        };
        finalContent = JSON.stringify(fallbackEditor);
      }

      const shouldShareToX = !initialMoment && shareToX && visibility === "public";
      const body = {
        content: finalContent,
        visibility,
        images,
        topicSlugs: topics,
        stockSymbol: attachedStockSymbol,
        ...(shouldShareToX ? { shareToX: true } : {}),
      };
      if (initialMoment) {
        await updateMoment({ id: initialMoment.id, body }).unwrap();
      } else {
        await createMoment(body).unwrap();
        if (shouldShareToX) {
          toast.success("Moment shared. X sync queued.");
        }
      }

      handleReset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to share moment:", error);
      // Keep the draft open; the API layer displays the mutation error.
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    mediaItems,
    removeMedia,
    updateMediaAlt,
    retryMedia,
    hasIncompleteUploads,
    hasMissingAlt,
    submitBlockReason,
    editorValue,
    setEditorValue,
    charCount,
    setCharCount,
    isEmpty,
    setIsEmpty,
    topics,
    addTopic: (topic: string) =>
      setTopics((current) =>
        current.length >= MOMENT_TOPIC_LIMIT || current.includes(topic)
          ? current
          : [...current, topic]
      ),
    removeTopic: (topic: string) =>
      setTopics((current) => current.filter((item) => item !== topic)),
    visibility,
    setVisibility,
    shareToX,
    setShareToX,
    isSubmitting,
    handleSelectFiles,
    handleDrop,
    publishMoment,
    handleReset,
    attachedStockSymbol,
    setAttachedStockSymbol,
  };
};
