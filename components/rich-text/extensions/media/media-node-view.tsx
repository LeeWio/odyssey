"use client";

import { Link, Surface, toast } from "@heroui/react";
import { DropZone } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import type { DropZoneProps } from "react-aria-components";
import { useCallback, useEffect, useRef, useState } from "react";

import { useUploadFileMutation } from "@/lib/features/file";
import {
  ACCEPTED_AUDIO_TYPES,
  claimMediaUpload,
  clearMediaUpload,
  failMediaUpload,
  getMediaUpload,
  queueMediaUpload,
  releaseMediaUpload,
  retryMediaUpload,
  validateMediaFile,
  type MediaKind,
} from "./media-upload";

type DropEvent = Parameters<NonNullable<DropZoneProps["onDrop"]>>[0];

interface ActiveUpload {
  abort: () => void;
  id: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName: string): string {
  const extension = fileName.split(".").pop();
  return extension && extension !== fileName ? extension.toUpperCase() : "FILE";
}

export function MediaNodeView({ deleteNode, editor, node, updateAttributes }: NodeViewProps) {
  const kind = node.type.name as Exclude<MediaKind, "image">;
  const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
  const fileName = typeof node.attrs.fileName === "string" ? node.attrs.fileName : "";
  const fileSize = typeof node.attrs.fileSize === "number" ? node.attrs.fileSize : 0;
  const uploadId = typeof node.attrs.uploadId === "string" ? node.attrs.uploadId : null;
  const [, setUploadVersion] = useState(0);
  const [uploadFile] = useUploadFileMutation();
  const activeUploadRef = useRef<ActiveUpload | null>(null);

  const refreshUpload = useCallback(() => setUploadVersion((version) => version + 1), []);

  const cancelUpload = useCallback(
    (id: string, removeEmptyNode = false) => {
      if (activeUploadRef.current?.id === id) {
        activeUploadRef.current.abort();
        activeUploadRef.current = null;
      }
      clearMediaUpload(editor, id);
      if (removeEmptyNode) deleteNode();
      else updateAttributes({ uploadId: null });
    },
    [deleteNode, editor, updateAttributes]
  );

  const beginUpload = useCallback(
    async (id: string, retry = false) => {
      const queuedUpload = retry ? retryMediaUpload(editor, id) : claimMediaUpload(editor, id);
      if (!queuedUpload) return;

      const request = uploadFile(queuedUpload.file);
      activeUploadRef.current = { abort: request.abort, id };
      refreshUpload();

      try {
        const response = await request.unwrap();
        if (activeUploadRef.current?.id !== id) return;

        clearMediaUpload(editor, id);
        activeUploadRef.current = null;
        updateAttributes({
          fileName: response.originalName || queuedUpload.file.name,
          fileSize: response.fileSize,
          mimeType: response.fileType,
          src: response.fileUrl,
          uploadId: null,
        });
      } catch {
        if (activeUploadRef.current?.id !== id) return;
        failMediaUpload(editor, id, "Upload failed. Try again.");
        refreshUpload();
      } finally {
        if (activeUploadRef.current?.id === id) activeUploadRef.current = null;
      }
    },
    [editor, refreshUpload, updateAttributes, uploadFile]
  );

  useEffect(() => {
    if (!uploadId) return;
    const timer = window.setTimeout(() => void beginUpload(uploadId), 0);

    return () => {
      window.clearTimeout(timer);
      if (activeUploadRef.current?.id === uploadId) {
        activeUploadRef.current.abort();
        activeUploadRef.current = null;
        releaseMediaUpload(editor, uploadId);
      }
    };
  }, [beginUpload, editor, uploadId]);

  useEffect(
    () => () => {
      const activeUpload = activeUploadRef.current;
      if (activeUpload) {
        activeUpload.abort();
        releaseMediaUpload(editor, activeUpload.id);
      }
    },
    [editor]
  );

  const queueUpload = useCallback(
    (file: File) => {
      const validationError = validateMediaFile(file, kind);
      const id = queueMediaUpload(editor, file, kind);
      if (validationError) {
        failMediaUpload(editor, id, validationError);
        toast.warning(validationError);
      }
      updateAttributes({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadId: id,
      });
      refreshUpload();
    },
    [editor, kind, refreshUpload, updateAttributes]
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
      if (fileItem?.kind === "file") queueUpload(await fileItem.getFile());
    },
    [queueUpload]
  );

  const pendingUpload = uploadId ? getMediaUpload(editor, uploadId) : null;
  const isUploading = pendingUpload?.status === "uploading";
  const isFailed = pendingUpload?.status === "failed";
  const label = kind === "audio" ? "audio file" : "attachment";

  if (!src) {
    const isDisabled = !editor.isEditable || isUploading;
    const acceptedTypes = kind === "audio" ? [...ACCEPTED_AUDIO_TYPES].join(",") : undefined;

    return (
      <NodeViewWrapper className="my-6" contentEditable={false}>
        <DropZone className="w-full">
          {!pendingUpload && (
            <DropZone.Area isDisabled={isDisabled} onDrop={handleDrop}>
              <DropZone.Icon>
                <Icon
                  aria-hidden="true"
                  icon={kind === "audio" ? "gravity-ui:music-note" : "gravity-ui:paperclip"}
                />
              </DropZone.Icon>
              <DropZone.Label>Add an {label}</DropZone.Label>
              <DropZone.Description>
                {kind === "audio"
                  ? "MP3, M4A, AAC, WAV, FLAC, OGG, or WebM up to 50 MB."
                  : "Upload a file up to 50 MB."}
              </DropZone.Description>
              <DropZone.Trigger isDisabled={isDisabled}>Select file</DropZone.Trigger>
            </DropZone.Area>
          )}
          <DropZone.Input accept={acceptedTypes} disabled={isDisabled} onSelect={handleSelect} />
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
    <NodeViewWrapper className="my-6" contentEditable={false} data-drag-handle>
      <Surface className="flex w-full items-center gap-3 rounded-xl p-3" variant="secondary">
        <span className="bg-accent-soft text-accent-soft-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Icon
            aria-hidden="true"
            icon={kind === "audio" ? "gravity-ui:music-note" : "gravity-ui:paperclip"}
          />
        </span>
        {kind === "audio" ? (
          <div className="min-w-0 flex-1">
            <p className="mb-2 truncate text-sm font-medium">{fileName || "Audio"}</p>
            <audio className="w-full" controls preload="metadata" src={src}>
              <track kind="captions" />
            </audio>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <Link
              className="block truncate font-medium no-underline"
              download={fileName || true}
              href={src}
              rel="noopener noreferrer"
              target="_blank"
            >
              {fileName || "Download attachment"}
            </Link>
            {fileSize > 0 && <p className="text-muted text-xs">{formatFileSize(fileSize)}</p>}
          </div>
        )}
      </Surface>
    </NodeViewWrapper>
  );
}
