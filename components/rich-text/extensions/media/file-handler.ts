import { FileHandler } from "@tiptap/extension-file-handler";
import type { Editor, JSONContent } from "@tiptap/react";
import { toast } from "@heroui/react";

import { createImageAltText } from "../image/image-upload";
import { normalizeLinkUrl } from "../../utils/link-utils";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_IMAGE_TYPES,
  inferMediaKind,
  queueMediaUpload,
  validateMediaFile,
  type MediaKind,
} from "./media-upload";

export type FileHandlerRejectReason = string;

export interface CreateFileHandlerOptions {
  /**
   * MIME allow-list at the TipTap plugin layer.
   * Omit (default) to accept any file type, then validate in-callback —
   * needed so generic attachments are not filtered out before onDrop/onPaste.
   */
  allowedMimeTypes?: string[];
  /**
   * When true (default), consume paste events that include files so other
   * paste rules do not insert duplicates. See TipTap FileHandler docs.
   */
  consumePasteEvent?: boolean;
  /** Called when a file fails validation and is not inserted. */
  onReject?: (file: File, reason: FileHandlerRejectReason) => void;
}

export interface InsertDroppedFilesOptions {
  onReject?: (file: File, reason: FileHandlerRejectReason) => void;
  /** Drop position from FileHandler; omit for paste / selection insert. */
  position?: number;
}

/** Image + audio MIME types currently supported by the upload pipeline. */
export const SUPPORTED_MEDIA_MIME_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_AUDIO_TYPES,
] as string[];

/**
 * Prefer remote/relative image URLs from pasted HTML when available.
 * TipTap docs note that clipboard Files for animated GIFs may only contain a
 * single PNG frame — HTML `src` is more reliable in that case.
 */
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

function createUploadPlaceholderNode(editor: Editor, file: File, kind: MediaKind): JSONContent {
  const uploadId = queueMediaUpload(editor, file, kind);

  if (kind === "image") {
    return {
      type: "image",
      attrs: {
        alt: createImageAltText(file.name),
        caption: "",
        uploadId,
      },
    };
  }

  return {
    type: kind,
    attrs: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadId,
    },
  };
}

function createRemoteImageNode(src: string): JSONContent {
  return {
    type: "image",
    attrs: {
      alt: "",
      caption: "",
      src,
    },
  };
}

/**
 * Build JSON nodes for dropped/pasted files using the shared media-upload queue.
 * Invalid files are rejected (not inserted). Upload itself stays in node views
 * via the existing `useUploadFileMutation` pipeline.
 */
export function buildFileInsertContent(
  editor: Editor,
  files: File[],
  onReject?: (file: File, reason: FileHandlerRejectReason) => void
): JSONContent[] {
  const content: JSONContent[] = [];

  for (const file of files) {
    const kind = inferMediaKind(file);
    const validationError = validateMediaFile(file, kind);

    if (validationError) {
      onReject?.(file, validationError);
      continue;
    }

    content.push(createUploadPlaceholderNode(editor, file, kind));
  }

  return content;
}

export function insertFilesIntoEditor(
  editor: Editor,
  files: File[],
  options: InsertDroppedFilesOptions = {}
) {
  if (!editor.isEditable || files.length === 0) return;

  const content = buildFileInsertContent(editor, files, options.onReject);
  if (content.length === 0) return;

  const chain = editor.chain().focus();
  if (typeof options.position === "number") {
    chain.insertContentAt(options.position, content).run();
  } else {
    chain.insertContent(content).run();
  }
}

/**
 * Paste handler aligned with TipTap FileHandler docs:
 * 1) Prefer image URLs from `htmlContent` when present
 * 2) Otherwise validate files and queue uploads through the existing media API
 */
export function handleFilePaste(
  editor: Editor,
  files: File[],
  htmlContent?: string,
  onReject?: (file: File, reason: FileHandlerRejectReason) => void
) {
  if (!editor.isEditable) return;

  const remoteImageUrls = extractImageUrlsFromHtml(htmlContent);
  if (remoteImageUrls.length > 0) {
    const content = remoteImageUrls.map(createRemoteImageNode);
    editor.chain().focus().insertContent(content).run();
    return;
  }

  insertFilesIntoEditor(editor, files, { onReject });
}

function defaultReject(file: File, reason: string) {
  toast.warning(`${file.name}: ${reason}`);
}

/**
 * Generic TipTap FileHandler factory.
 * Does not upload — only handles drop/paste events and inserts nodes that the
 * existing media/image node views upload via `useUploadFileMutation`.
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

/** Odyssey editor default: all MIME types at plugin layer; validate per media kind. */
export function createMediaFileHandler(
  options: Omit<CreateFileHandlerOptions, "allowedMimeTypes"> = {}
) {
  return createFileHandler({
    // Intentionally omit allowedMimeTypes so generic attachments still arrive.
    // Image/audio/attachment rules are enforced in validateMediaFile.
    consumePasteEvent: true,
    ...options,
  });
}

/** @deprecated Prefer createMediaFileHandler() for a fresh instance per editor. */
export const MediaFileHandler = createMediaFileHandler();
