"use client";

import { Button, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useCallback } from "react";

import {
  useAutoUploadPendingFile,
  useFilePicker,
  useImageDropZone,
  useImageUploader,
} from "./hooks";

export function ImageUploader({
  onUpload,
  initialFile = null,
}: {
  onUpload: (url: string) => void;
  initialFile?: File | null;
}) {
  const { loading, upload } = useImageUploader({ onUpload });
  const { inputRef, openFilePicker, onFileChange, accept } = useFilePicker();
  const { draggedInside, onDragEnter, onDragLeave, onDrop } = useImageDropZone({
    uploader: upload,
  });

  useAutoUploadPendingFile({ file: initialFile, upload });

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onFileChange(event, upload),
    [onFileChange, upload]
  );

  if (loading) {
    return (
      <div className="bg-surface-secondary flex min-h-40 items-center justify-center rounded-2xl p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div
      className={`bg-surface-secondary flex flex-col items-center justify-center rounded-2xl px-8 py-10 transition-colors ${
        draggedInside ? "bg-default/60" : ""
      }`}
      contentEditable={false}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <Icon
        aria-hidden="true"
        className="text-muted mb-4 size-12 opacity-40"
        icon="gravity-ui:picture"
      />
      <p className="text-muted mb-3 text-center text-sm">
        {draggedInside ? "Drop image here" : "Drag and drop or upload an image"}
      </p>
      <Button size="sm" variant="secondary" isDisabled={draggedInside} onPress={openFilePicker}>
        <Icon aria-hidden="true" icon="gravity-ui:arrow-up-from-line" />
        Upload image
      </Button>
      <input
        ref={inputRef}
        accept={accept}
        className="hidden"
        type="file"
        onChange={handleFileChange}
      />
    </div>
  );
}
