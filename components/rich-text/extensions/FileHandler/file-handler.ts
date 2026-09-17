import { FileHandler } from "@tiptap/extension-file-handler";
import type { Editor, JSONContent } from "@tiptap/react";
import { toast } from "@heroui/react";

import { normalizeLinkUrl } from "../../utils/link-utils";
import { stashPendingImageFile } from "../ImageUpload/pending-files";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_IMAGE_TYPES,
  inferMediaKind,
  queueMediaUpload,
  validateMediaFile,
  type MediaKind,
} from "../media/media-upload";

export type FileHandlerRejectReason = string;

export interface CreateFileHandlerOptions {
  allowedMimeTypes?: string[];
  consumePasteEvent?: boolean;
  onReject?: (file: File, reason: FileHandlerRejectReason) => void;
}

export const SUPPORTED_MEDIA_MIME_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_AUDIO_TYPES,
] as string[];

export function extractImageUrlsFromHtml(html: string | undefined): string[] {
  if (!html || typeof document === "undefined") return [];

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const urls: string[] = [];

    for (const image of doc.querySelectorAll("img[src]")) {
      const raw = image.getAttribute("src");
      if (!raw) continue;
      const normalized = normalizeLinkUrl(raw);
      if (normalized) urls.push(normalized);
    }

    return urls;
  } catch {
    return [];
  }
}

function createImageAltText(fileName: string): string {
  const extensionStart = fileName.lastIndexOf(".");
  return extensionStart > 0 ? fileName.slice(0, extensionStart) : fileName;
}

function createMediaPlaceholderNode(editor: Editor, file: File, kind: Exclude<MediaKind, "image">) {
  const uploadId = queueMediaUpload(editor, file, kind);
  return {
    type: kind,
    attrs: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadId,
    },
  } satisfies JSONContent;
}

function defaultReject(file: File, reason: string) {
  toast.warning(`${file.name}: ${reason}`);
}

/**
 * Insert dropped/pasted files using the ImageUpload placeholder for images
 * (template pattern) and the media upload queue for audio/attachments.
 */
export function insertFilesIntoEditor(
  editor: Editor,
  files: File[],
  options: { onReject?: (file: File, reason: string) => void; position?: number } = {}
) {
  if (!editor.isEditable || files.length === 0) return;

  const content: JSONContent[] = [];
  const onReject = options.onReject;

  for (const file of files) {
    const kind = inferMediaKind(file);
    const validationError = validateMediaFile(file, kind);
    if (validationError) {
      onReject?.(file, validationError);
      continue;
    }

    if (kind === "image") {
      content.push({
        type: "imageUpload",
        attrs: { fileKey: stashPendingImageFile(file) },
      });
      continue;
    }

    content.push(createMediaPlaceholderNode(editor, file, kind));
  }

  if (content.length === 0) return;

  const chain = editor.chain().focus();
  if (typeof options.position === "number") {
    chain.insertContentAt(options.position, content).run();
  } else {
    chain.insertContent(content).run();
  }
}

export function handleFilePaste(
  editor: Editor,
  files: File[],
  htmlContent?: string,
  onReject?: (file: File, reason: string) => void
) {
  if (!editor.isEditable) return;

  const remoteImageUrls = extractImageUrlsFromHtml(htmlContent);
  if (remoteImageUrls.length > 0) {
    editor
      .chain()
      .focus()
      .insertContent(
        remoteImageUrls.map((src) => ({
          type: "image",
          attrs: { src, alt: "", caption: "", alignment: "center", widthPercent: 100 },
        }))
      )
      .run();
    return;
  }

  insertFilesIntoEditor(editor, files, { onReject });
}

/**
 * Generic TipTap FileHandler factory (OSS). Does not upload — routes files into
 * ImageUpload placeholders or media nodes that use the existing upload API.
 */
export function createFileHandler(options: CreateFileHandlerOptions = {}) {
  const { allowedMimeTypes, consumePasteEvent = true, onReject = defaultReject } = options;

  return FileHandler.configure({
    allowedMimeTypes,
    consumePasteEvent,
    onDrop: (editor, files, position) => {
      insertFilesIntoEditor(editor, files, { onReject, position });
    },
    onPaste: (editor, files, htmlContent) => {
      handleFilePaste(editor, files, htmlContent, onReject);
    },
  });
}

export function createMediaFileHandler(
  options: Omit<CreateFileHandlerOptions, "allowedMimeTypes"> = {}
) {
  return createFileHandler({
    consumePasteEvent: true,
    ...options,
  });
}

/** @deprecated Prefer createMediaFileHandler() per editor instance. */
export const MediaFileHandler = createMediaFileHandler();

export { createImageAltText };
