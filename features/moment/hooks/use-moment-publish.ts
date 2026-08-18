import { useState, useCallback } from "react";
import type { JSONContent } from "@tiptap/core";
import { useCreateMomentMutation } from "@/lib/features/moment";
import { useUploadFileMutation } from "@/lib/features/file/file-api";

export const useMomentPublish = (onSuccess?: () => void) => {
  const [editorValue, setEditorValue] = useState<JSONContent | undefined>(undefined);
  const [charCount, setCharCount] = useState(0);
  const [isEmpty, setIsEmpty] = useState(true);
  const [attachments, setAttachments] = useState<{ file: File; preview: string }[]>([]);
  const [visibility, setVisibility] = useState("public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createMoment] = useCreateMomentMutation();
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

  const handleReset = useCallback(() => {
    attachments.forEach((a) => URL.revokeObjectURL(a.preview));
    setEditorValue(undefined);
    setCharCount(0);
    setIsEmpty(true);
    setAttachments([]);
    setVisibility("public");
    setIsSubmitting(false);
  }, [attachments]);

  const publishMoment = async () => {
    if ((isEmpty && attachments.length === 0) || charCount > 280 || isSubmitting) return;
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

      // 2. Submit the moment
      await createMoment({
        content: editorValue ? JSON.stringify(editorValue) : "",
        visibility: visibility as "public" | "followers" | "private",
        images: uploadedImages,
      }).unwrap();

      // 3. Reset states & call callback
      handleReset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to share moment:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    editorValue,
    setEditorValue,
    charCount,
    setCharCount,
    isEmpty,
    setIsEmpty,
    attachments,
    setAttachments,
    visibility,
    setVisibility,
    isSubmitting,
    handleSelectFiles,
    handleDrop,
    handleRemoveAttachment,
    publishMoment,
    handleReset,
  };
};
