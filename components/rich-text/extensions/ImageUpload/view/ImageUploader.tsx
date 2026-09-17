"use client";

import { DropZone } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useCallback } from "react";
import type { DropZoneProps } from "react-aria-components";

import { ACCEPTED_IMAGE_TYPES } from "../../media/media-upload";
import { useAutoUploadPendingFile, useImageUploader } from "./hooks";

type DropEvent = Parameters<NonNullable<DropZoneProps["onDrop"]>>[0];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName: string): string {
  const extension = fileName.split(".").pop();
  if (!extension || extension === fileName) return "IMG";
  return extension.toLowerCase() === "jpeg" ? "JPG" : extension.toUpperCase();
}

export function ImageUploader({
  onUpload,
  initialFile = null,
  onCancel,
}: {
  onUpload: (url: string) => void;
  initialFile?: File | null;
  onCancel?: () => void;
}) {
  const { activeFile, clear, error, loading, retry, upload } = useImageUploader({ onUpload });
  useAutoUploadPendingFile({ file: initialFile, upload });

  const isDisabled = loading;
  const pendingFile = activeFile ?? initialFile;
  const status = error ? "failed" : loading ? "uploading" : "complete";

  const handleSelect = useCallback(
    (files: FileList) => {
      const file = files.item(0);
      if (file) void upload(file);
    },
    [upload]
  );

  const handleDrop = useCallback(
    async (event: DropEvent) => {
      const fileItem = event.items.find((item) => item.kind === "file");
      if (fileItem?.kind === "file") {
        void upload(await fileItem.getFile());
      }
    },
    [upload]
  );

  return (
    <DropZone className="w-full">
      {!pendingFile && (
        <DropZone.Area
          isDisabled={isDisabled}
          getDropOperation={(types) =>
            [...ACCEPTED_IMAGE_TYPES].some((type) => types.has(type)) ? "copy" : "cancel"
          }
          onDrop={handleDrop}
        >
          <DropZone.Icon>
            <Icon aria-hidden="true" icon="gravity-ui:picture" />
          </DropZone.Icon>
          <DropZone.Label>Add an image</DropZone.Label>
          <DropZone.Description>PNG, JPG, GIF, WebP, or SVG up to 10 MB.</DropZone.Description>
          <DropZone.Trigger isDisabled={isDisabled}>Select image</DropZone.Trigger>
        </DropZone.Area>
      )}

      <DropZone.Input
        accept={[...ACCEPTED_IMAGE_TYPES].join(",")}
        disabled={isDisabled}
        onSelect={handleSelect}
      />

      {pendingFile && (
        <DropZone.FileList>
          <DropZone.FileItem status={status === "complete" ? "uploading" : status}>
            <DropZone.FileFormatIcon format={getFileExtension(pendingFile.name)} />
            <DropZone.FileInfo>
              <DropZone.FileName>{pendingFile.name}</DropZone.FileName>
              <DropZone.FileMeta>
                {formatFileSize(pendingFile.size)} · {error ?? "Uploading…"}
              </DropZone.FileMeta>
              {loading && (
                <DropZone.FileProgress aria-label={`Uploading ${pendingFile.name}`} isIndeterminate>
                  <DropZone.FileProgressTrack>
                    <DropZone.FileProgressFill />
                  </DropZone.FileProgressTrack>
                </DropZone.FileProgress>
              )}
            </DropZone.FileInfo>
            {error && (
              <DropZone.FileRetryTrigger
                aria-label={`Retry uploading ${pendingFile.name}`}
                onPress={() => retry()}
              />
            )}
            <DropZone.FileRemoveTrigger
              aria-label={`Remove ${pendingFile.name}`}
              onPress={() => {
                clear();
                onCancel?.();
              }}
            />
          </DropZone.FileItem>
        </DropZone.FileList>
      )}
    </DropZone>
  );
}
