import { useState, useCallback } from "react";
import type { JSONContent } from "@tiptap/core";
import {
  useCreateMomentMutation,
  useUpdateMomentMutation,
  type MomentResponse,
} from "@/lib/features/moment";
import { useUploadFileMutation } from "@/lib/features/file/file-api";
import { MOMENT_CHARACTER_LIMIT } from "../utils/character-count";
import { MOMENT_TOPIC_LIMIT } from "../utils/topic-slug";
import { parseMomentContent, isDocumentEmpty } from "../utils/content-parser";

export const useMomentPublish = (onSuccess?: () => void, initialMoment?: MomentResponse) => {
  const initialContent = initialMoment ? parseMomentContent(initialMoment.content) : undefined;
  const countText = (node: JSONContent): number =>
    (node.text?.length ?? 0) +
    (node.content?.reduce((sum, child) => sum + countText(child), 0) ?? 0);
  const [existingImages, setExistingImages] = useState(initialMoment?.images ?? []);
  const [editorValue, setEditorValue] = useState<JSONContent | undefined>(initialContent);
  const [charCount, setCharCount] = useState(initialContent ? countText(initialContent) : 0);
  const [isEmpty, setIsEmpty] = useState(isDocumentEmpty(initialContent));
  const [attachments, setAttachments] = useState<{ file: File; preview: string }[]>([]);
  const [topics, setTopics] = useState<string[]>(
    initialMoment?.topics.map((topic) => topic.slug) ?? []
  );
  const [visibility, setVisibility] = useState(initialMoment?.visibility ?? "public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom stock trend widget attachment state
  const [attachedStockSymbol, setAttachedStockSymbol] = useState<string | null>(
    initialMoment?.stockSymbol ?? null
  );

  const [createMoment] = useCreateMomentMutation();
  const [updateMoment] = useUpdateMomentMutation();
  const [uploadFile] = useUploadFileMutation();

  const handleSelectFiles = useCallback((fileList: FileList) => {
    const newAttachments = Array.from(fileList).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const handleDrop = useCallback(
    async (e: { items: Iterable<{ kind: string; getFile?: () => Promise<File | null> }> }) => {
      const dropped: File[] = [];
      for (const item of Array.from(e.items)) {
        if (item.kind === "file" && item.getFile) {
          const file = await item.getFile();
          if (file) dropped.push(file);
        }
      }
      const newAttachments = dropped.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setAttachments((prev) => [...prev, ...newAttachments]);
    },
    []
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleReset = () => {
    attachments.forEach((a) => URL.revokeObjectURL(a.preview));
    setEditorValue(undefined);
    setCharCount(0);
    setIsEmpty(true);
    setAttachments([]);
    setExistingImages([]);
    setTopics([]);
    setAttachedStockSymbol(null);
    setVisibility("public");
    setIsSubmitting(false);
  };

  const publishMoment = async () => {
    if (
      (isEmpty &&
        attachments.length === 0 &&
        existingImages.length === 0 &&
        !attachedStockSymbol) ||
      charCount > MOMENT_CHARACTER_LIMIT ||
      isSubmitting
    )
      return;
    setIsSubmitting(true);
    try {
      // 1. Upload images in parallel if any
      const uploadedImages = await Promise.all(
        attachments.map(async ({ file }) => {
          const res = await uploadFile(file).unwrap();
          if (!res.id) throw new Error("Uploaded file is missing an ID.");
          return {
            fileId: res.id,
            altText: file.name || "Moment Attachment",
          };
        })
      );

      // Construct standard rich-text content
      let finalContent = "";
      if (editorValue) {
        finalContent = JSON.stringify(editorValue);
      } else if (attachedStockSymbol) {
        // Fallback for stock only publishing
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

      // 2. Submit the moment
      const body = {
        content: finalContent,
        visibility,
        images: [
          ...existingImages.map(({ fileId, altText }) => ({ fileId, altText })),
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

      // 3. Reset states & call callback
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
    existingImages,
    removeExistingImage: (index: number) =>
      setExistingImages((images) => images.filter((_, i) => i !== index)),
    editorValue,
    setEditorValue,
    charCount,
    setCharCount,
    isEmpty,
    setIsEmpty,
    attachments,
    setAttachments,
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
    handleRemoveAttachment,
    publishMoment,
    handleReset,
    attachedStockSymbol,
    setAttachedStockSymbol,
  };
};
