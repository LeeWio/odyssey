"use client";

import { Surface } from "@heroui/react";
import { DropZone } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import NextImage from "next/image";
import type { DropZoneProps } from "react-aria-components";
import { useCallback, useEffect, useRef, useState } from "react";

import { useUploadFileMutation } from "@/lib/features/file";
import {
  normalizeImageAlignment,
  normalizeImageWidthPercent,
  type ImageAlignment,
} from "./image-attributes";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);

type DropEvent = Parameters<NonNullable<DropZoneProps["onDrop"]>>[0];

interface PendingImage {
  error?: string;
  file: File;
  status: "failed" | "uploading";
}

interface ActiveUpload {
  abort: () => void;
  id: symbol;
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

function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return "Choose a PNG, JPG, GIF, WebP, or SVG image.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "The image must be 10 MB or smaller.";
  }

  return null;
}

export function ImageNodeView({ editor, node, updateAttributes }: NodeViewProps) {
  const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
  const alignment = normalizeImageAlignment(node.attrs.alignment);
  const widthPercent = normalizeImageWidthPercent(node.attrs.widthPercent);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [uploadFile] = useUploadFileMutation();
  const activeUploadRef = useRef<ActiveUpload | null>(null);

  useEffect(() => {
    return () => {
      activeUploadRef.current?.abort();
      activeUploadRef.current = null;
    };
  }, []);

  const uploadImage = useCallback(
    async (file: File) => {
      const validationError = validateImage(file);

      if (validationError) {
        setPendingImage({ error: validationError, file, status: "failed" });
        return;
      }

      activeUploadRef.current?.abort();

      const id = Symbol(file.name);
      const request = uploadFile(file);
      activeUploadRef.current = { abort: request.abort, id };
      setPendingImage({ file, status: "uploading" });

      try {
        const response = await request.unwrap();

        if (activeUploadRef.current?.id !== id) return;

        updateAttributes({
          alt: file.name,
          src: response.fileUrl,
        });
      } catch {
        if (activeUploadRef.current?.id !== id) return;

        setPendingImage({
          error: "Upload failed. Try again.",
          file,
          status: "failed",
        });
      } finally {
        if (activeUploadRef.current?.id === id) {
          activeUploadRef.current = null;
        }
      }
    },
    [updateAttributes, uploadFile]
  );

  const handleSelect = useCallback(
    (files: FileList) => {
      const file = files.item(0);
      if (file) void uploadImage(file);
    },
    [uploadImage]
  );

  const handleDrop = useCallback(
    async (event: DropEvent) => {
      const fileItem = event.items.find((item) => item.kind === "file");
      if (fileItem?.kind === "file") {
        await uploadImage(await fileItem.getFile());
      }
    },
    [uploadImage]
  );

  const clearPendingImage = useCallback(() => {
    activeUploadRef.current?.abort();
    activeUploadRef.current = null;
    setPendingImage(null);
  }, []);

  if (!src) {
    const isDisabled = !editor.isEditable || pendingImage?.status === "uploading";

    return (
      <NodeViewWrapper className="my-8" contentEditable={false}>
        <DropZone className="w-full">
          {!pendingImage && (
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
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            disabled={isDisabled}
            onSelect={handleSelect}
          />

          {pendingImage && (
            <DropZone.FileList>
              <DropZone.FileItem status={pendingImage.status}>
                <DropZone.FileFormatIcon format={getFileExtension(pendingImage.file.name)} />
                <DropZone.FileInfo>
                  <DropZone.FileName>{pendingImage.file.name}</DropZone.FileName>
                  <DropZone.FileMeta>
                    {formatFileSize(pendingImage.file.size)} · {pendingImage.error ?? "Uploading…"}
                  </DropZone.FileMeta>
                  {pendingImage.status === "uploading" && (
                    <DropZone.FileProgress
                      aria-label={`Uploading ${pendingImage.file.name}`}
                      isIndeterminate
                    >
                      <DropZone.FileProgressTrack>
                        <DropZone.FileProgressFill />
                      </DropZone.FileProgressTrack>
                    </DropZone.FileProgress>
                  )}
                </DropZone.FileInfo>
                {pendingImage.status === "failed" && (
                  <DropZone.FileRetryTrigger
                    aria-label={`Retry uploading ${pendingImage.file.name}`}
                    onPress={() => void uploadImage(pendingImage.file)}
                  />
                )}
                <DropZone.FileRemoveTrigger
                  aria-label={`Remove ${pendingImage.file.name}`}
                  onPress={clearPendingImage}
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
        className="max-w-full flex-none overflow-hidden rounded-2xl"
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
      </Surface>
    </NodeViewWrapper>
  );
}
