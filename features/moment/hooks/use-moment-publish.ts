import { useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { toast } from "@heroui/react";
import {
  useCreateMomentMutation,
  useUpdateMomentMutation,
  type MomentImageResponse,
  type MomentResponse,
} from "@/lib/features/moment";
import { useUploadFileMutation } from "@/lib/features/file/file-api";
import { MOMENT_CHARACTER_LIMIT } from "../utils/character-count";
import { MOMENT_TOPIC_LIMIT } from "../utils/topic-slug";
import { parseMomentContent, isDocumentEmpty } from "../utils/content-parser";
import {
  MOMENT_MAX_IMAGES,
  defaultMomentAltText,
  validateMomentImageFile,
} from "../utils/media-limits";

export type PublisherMediaItem =
  | {
      id: string;
      kind: "existing";
      preview: string;
      fileId: number;
      altText: string;
      existing: MomentImageResponse;
    }
  | {
      id: string;
      kind: "local";
      preview: string;
      file: File;
      altText: string;
    };

function toExistingMedia(image: MomentImageResponse): PublisherMediaItem {
  return {
    id: `existing-${image.id}`,
    kind: "existing",
    preview: image.thumbnailUrl || image.fileUrl,
    fileId: image.fileId,
    altText: image.altText,
    existing: image,
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
  const countText = (node: JSONContent): number =>
    (node.text?.length ?? 0) +
    (node.content?.reduce((sum, child) => sum + countText(child), 0) ?? 0);
  const [mediaItems, setMediaItems] = useState<PublisherMediaItem[]>(
    () => initialMoment?.images.map(toExistingMedia) ?? []
  );

  const [editorValue, setEditorValue] = useState<JSONContent | undefined>(initialContent);
  const [charCount, setCharCount] = useState(initialContent ? countText(initialContent) : 0);
  const [isEmpty, setIsEmpty] = useState(isDocumentEmpty(initialContent));
  const [topics, setTopics] = useState<string[]>(
    initialMoment?.topics.map((topic) => topic.slug) ?? []
  );
  const [visibility, setVisibility] = useState(initialMoment?.visibility ?? "public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [attachedStockSymbol, setAttachedStockSymbol] = useState<string | null>(
    initialMoment?.stockSymbol ?? null
  );

  const [createMoment] = useCreateMomentMutation();
  const [updateMoment] = useUpdateMomentMutation();
  const [uploadFile] = useUploadFileMutation();

  const appendFiles = (files: File[]) => {
    const remaining = MOMENT_MAX_IMAGES - mediaItems.length;
    if (remaining <= 0) {
      toast.warning("A moment can contain up to 9 images.");
      return;
    }

    const accepted: PublisherMediaItem[] = [];
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
      });
    }

    if (accepted.length === 0) return;
    setMediaItems([...mediaItems, ...accepted]);
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
    setMediaItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.kind === "local") {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleReset = () => {
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
    setIsSubmitting(false);
  };

  const publishMoment = async () => {
    if (
      (isEmpty && mediaItems.length === 0 && !attachedStockSymbol) ||
      charCount > MOMENT_CHARACTER_LIMIT ||
      isSubmitting
    )
      return;
    setIsSubmitting(true);
    try {
      const localItems = mediaItems.filter(
        (item): item is Extract<PublisherMediaItem, { kind: "local" }> => item.kind === "local"
      );
      const existingItems = mediaItems.filter(
        (item): item is Extract<PublisherMediaItem, { kind: "existing" }> =>
          item.kind === "existing"
      );

      const uploadedImages = await Promise.all(
        localItems.map(async ({ file, altText }) => {
          const res = await uploadFile(file).unwrap();
          if (!res.id) throw new Error("Uploaded file is missing an ID.");
          return {
            fileId: res.id,
            altText: altText || defaultMomentAltText(file.name),
          };
        })
      );

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

      const body = {
        content: finalContent,
        visibility,
        images: [
          ...existingItems.map(({ fileId, altText }) => ({ fileId, altText })),
          ...uploadedImages,
        ],
        topicSlugs: topics,
        stockSymbol: attachedStockSymbol,
      };
      if (initialMoment) {
        await updateMoment({ id: initialMoment.id, body }).unwrap();
      } else {
        await createMoment(body).unwrap();
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
    isSubmitting,
    handleSelectFiles,
    handleDrop,
    publishMoment,
    handleReset,
    attachedStockSymbol,
    setAttachedStockSymbol,
  };
};
