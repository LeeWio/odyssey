"use client";

import { Button, Surface, toast } from "@heroui/react";
import { DropZone } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import NextImage from "next/image";
import type { DropZoneProps } from "react-aria-components";
import { useCallback, useEffect, useRef, useState } from "react";

import { useUploadFileMutation } from "@/lib/features/file";
import {
  claimImageUpload,
  clearImageUpload,
  createImageAltText,
  getImageUpload,
  markImageUploadFailed,
  queueImageUpload,
  releaseImageUpload,
  retryImageUpload,
  validateImageFile,
} from "./image-upload";
import {
  normalizeImageAlignment,
  normalizeImageWidthPercent,
  type ImageAlignment,
} from "./image-attributes";

type DropEvent = Parameters<NonNullable<DropZoneProps["onDrop"]>>[0];

interface ActiveUpload {
  abort: () => void;
  id: string;
}

const IMAGE_ALIGNMENT_CLASS_NAMES: Record<ImageAlignment, string> = {
  center: "justify-center",
  left: "justify-start",
  right: "justify-end",
};

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

export function ImageNodeView({ deleteNode, editor, node, updateAttributes }: NodeViewProps) {
  const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
  const uploadId = typeof node.attrs.uploadId === "string" ? node.attrs.uploadId : null;
  const alignment = normalizeImageAlignment(node.attrs.alignment);
  const widthPercent = normalizeImageWidthPercent(node.attrs.widthPercent);
  const [, setUploadVersion] = useState(0);
  const [uploadFile] = useUploadFileMutation();
  const activeUploadRef = useRef<ActiveUpload | null>(null);

  const refreshUpload = useCallback(() => {
    setUploadVersion((version) => version + 1);
  }, []);

  const cancelUpload = useCallback(
    (id: string, removeEmptyNode = false) => {
      if (activeUploadRef.current?.id === id) {
        activeUploadRef.current.abort();
        activeUploadRef.current = null;
      }

      clearImageUpload(editor, id);
      if (removeEmptyNode) {
        deleteNode();
      } else {
        updateAttributes({ uploadId: null });
      }
    },
    [deleteNode, editor, updateAttributes]
  );

  const beginUpload = useCallback(
    async (id: string, retry = false) => {
      const queuedUpload = retry ? retryImageUpload(editor, id) : claimImageUpload(editor, id);

      if (!queuedUpload) return;

      const request = uploadFile(queuedUpload.file);
      activeUploadRef.current = { abort: request.abort, id };
      refreshUpload();

      try {
        const response = await request.unwrap();

        if (activeUploadRef.current?.id !== id) return;

        clearImageUpload(editor, id);
        activeUploadRef.current = null;
        updateAttributes({
          alt: alt || createImageAltText(queuedUpload.file.name),
          src: response.fileUrl,
          uploadId: null,
        });
      } catch {
        if (activeUploadRef.current?.id !== id) return;

        markImageUploadFailed(editor, id, "Upload failed. Try again.");
        refreshUpload();
      } finally {
        if (activeUploadRef.current?.id === id) {
          activeUploadRef.current = null;
        }
      }
    },
    [alt, editor, refreshUpload, updateAttributes, uploadFile]
  );

  useEffect(() => {
    if (!uploadId) return;

    const timer = window.setTimeout(() => {
      void beginUpload(uploadId);
    }, 0);

    return () => {
      window.clearTimeout(timer);

      if (activeUploadRef.current?.id === uploadId) {
        activeUploadRef.current.abort();
        activeUploadRef.current = null;
        releaseImageUpload(editor, uploadId);
      }

      if (getImageUpload(editor, uploadId)?.status === "pending") {
        clearImageUpload(editor, uploadId);
      }
    };
  }, [beginUpload, editor, uploadId]);

  useEffect(() => {
    return () => {
      const activeUpload = activeUploadRef.current;

      if (activeUpload) {
        activeUpload.abort();
        releaseImageUpload(editor, activeUpload.id);
        activeUploadRef.current = null;
      }
    };
  }, [editor]);

  const queueUpload = useCallback(
    (file: File) => {
      const id = queueImageUpload(editor, file);
      const validationError = validateImageFile(file);

      if (validationError) {
        markImageUploadFailed(editor, id, validationError);
        toast.warning(validationError);
      }

      updateAttributes({
        alt: src ? alt : createImageAltText(file.name),
        uploadId: id,
      });
      refreshUpload();
    },
    [alt, editor, refreshUpload, src, updateAttributes]
  );

  const handleSelect = useCallback(
    (files: FileList) => {
      const file = files.item(0);
      if (file) queueUpload(file);
    },
    [queueUpload]
  );

  const handleDrop = useCallback(
    async (event: DropEvent) => {
      const fileItem = event.items.find((item) => item.kind === "file");
      if (fileItem?.kind === "file") {
        queueUpload(await fileItem.getFile());
      }
    },
    [queueUpload]
  );

  const pendingUpload = uploadId ? getImageUpload(editor, uploadId) : null;
  const isUploading = pendingUpload?.status === "uploading";
  const isFailed = pendingUpload?.status === "failed";

  if (!src) {
    const isDisabled = !editor.isEditable || isUploading;

    return (
      <NodeViewWrapper className="my-8" contentEditable={false}>
        <DropZone className="w-full">
          {!pendingUpload && (
            <DropZone.Area
              isDisabled={isDisabled}
              getDropOperation={(types) =>
                ["image/gif", "image/jpeg", "image/png", "image/svg+xml", "image/webp"].some(
                  (type) => types.has(type)
                )
                  ? "copy"
                  : "cancel"
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
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            disabled={isDisabled}
            onSelect={handleSelect}
          />

          {pendingUpload && (
            <DropZone.FileList>
              <DropZone.FileItem
                status={pendingUpload.status === "pending" ? "uploading" : pendingUpload.status}
              >
                <DropZone.FileFormatIcon format={getFileExtension(pendingUpload.file.name)} />
                <DropZone.FileInfo>
                  <DropZone.FileName>{pendingUpload.file.name}</DropZone.FileName>
                  <DropZone.FileMeta>
                    {formatFileSize(pendingUpload.file.size)} ·{" "}
                    {pendingUpload.error ?? "Uploading…"}
                  </DropZone.FileMeta>
                  {isUploading && (
                    <DropZone.FileProgress
                      aria-label={`Uploading ${pendingUpload.file.name}`}
                      isIndeterminate
                    >
                      <DropZone.FileProgressTrack>
                        <DropZone.FileProgressFill />
                      </DropZone.FileProgressTrack>
                    </DropZone.FileProgress>
                  )}
                </DropZone.FileInfo>
                {isFailed && (
                  <DropZone.FileRetryTrigger
                    aria-label={`Retry uploading ${pendingUpload.file.name}`}
                    onPress={() => void beginUpload(uploadId!, true)}
                  />
                )}
                <DropZone.FileRemoveTrigger
                  aria-label={`Remove ${pendingUpload.file.name}`}
                  onPress={() => cancelUpload(uploadId!, true)}
                />
              </DropZone.FileItem>
            </DropZone.FileList>
          )}
        </DropZone>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className={`my-8 flex w-full ${IMAGE_ALIGNMENT_CLASS_NAMES[alignment]}`}
      contentEditable={false}
      data-drag-handle
    >
      <Surface
        variant="transparent"
        className="relative max-w-full flex-none overflow-hidden rounded-2xl"
        style={{ width: `${widthPercent}%` }}
      >
        <NextImage
          alt={alt}
          className="h-auto w-full object-contain"
          height={900}
          sizes="(max-width: 768px) 100vw, 960px"
          src={src}
          unoptimized
          width={1600}
        />
        {pendingUpload && (
          <div className="bg-overlay/80 absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-3 text-sm backdrop-blur-sm">
            <span className="min-w-0 truncate">
              {isFailed ? pendingUpload.error : `Uploading ${pendingUpload.file.name}…`}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              {isFailed && (
                <Button
                  isIconOnly
                  aria-label="Retry image upload"
                  size="sm"
                  variant="secondary"
                  onPress={() => void beginUpload(uploadId!, true)}
                >
                  <Icon aria-hidden="true" icon="gravity-ui:arrow-rotate-right" />
                </Button>
              )}
              <Button
                isIconOnly
                aria-label="Cancel image replacement"
                size="sm"
                variant="secondary"
                onPress={() => cancelUpload(uploadId!)}
              >
                <Icon aria-hidden="true" icon="gravity-ui:xmark" />
              </Button>
            </div>
          </div>
        )}
      </Surface>
    </NodeViewWrapper>
  );
}
