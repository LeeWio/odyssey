"use client";

import { toast } from "@heroui/react";
import { type ChangeEvent, type DragEvent, useCallback, useEffect, useRef, useState } from "react";

import { useUploadFileMutation } from "@/lib/features/file";
import { ACCEPTED_IMAGE_TYPES, validateMediaFile } from "../../media/media-upload";

export function useImageUploader({ onUpload }: { onUpload: (url: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [uploadFile] = useUploadFileMutation();

  const upload = useCallback(
    async (file: File) => {
      const validationError = validateMediaFile(file, "image");
      if (validationError) {
        toast.warning(validationError);
        return;
      }

      setLoading(true);
      try {
        const response = await uploadFile(file).unwrap();
        onUpload(response.fileUrl);
      } catch {
        toast.danger("Image upload failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [onUpload, uploadFile]
  );

  return { loading, upload };
}

export function useFilePicker() {
  const inputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, upload: (file: File) => void) => {
      const file = event.target.files?.item(0);
      event.target.value = "";
      if (file) void upload(file);
    },
    []
  );

  return { inputRef, openFilePicker, onFileChange, accept: [...ACCEPTED_IMAGE_TYPES].join(",") };
}

export function useImageDropZone({ uploader }: { uploader: (file: File) => void }) {
  const [draggedInside, setDraggedInside] = useState(false);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      setDraggedInside(false);
      const files = Array.from(event.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (files.length === 0) return;

      event.preventDefault();
      const file = files[0];
      if (file) uploader(file);
    },
    [uploader]
  );

  return {
    draggedInside,
    onDragEnter: () => setDraggedInside(true),
    onDragLeave: () => setDraggedInside(false),
    onDrop,
  };
}

export function useAutoUploadPendingFile({
  file,
  upload,
}: {
  file: File | null;
  upload: (file: File) => Promise<void> | void;
}) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (!file || startedRef.current) return;
    startedRef.current = true;
    void upload(file);
  }, [file, upload]);
}
