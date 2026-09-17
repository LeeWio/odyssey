import {
  FileHandlePlugin,
  FileHandler as TiptapFileHandler,
  type FileHandlerOptions as TiptapFileHandlerOptions,
} from "@tiptap/extension-file-handler";
import type { Editor, JSONContent } from "@tiptap/react";
import { PluginKey } from "@tiptap/pm/state";
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

export type FileHandlerOptions = TiptapFileHandlerOptions & {
  onReject?: (file: File, reason: FileHandlerRejectReason) => void;
};

export const SUPPORTED_MEDIA_MIME_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_AUDIO_TYPES,
] as string[];

function defaultReject(file: File, reason: string) {
  toast.warning(`${file.name}: ${reason}`);
}

function parseHtmlDocument(html: string): Document | null {
  if (typeof document === "undefined") return null;

  try {
    return new DOMParser().parseFromString(html, "text/html");
  } catch {
    return null;
  }
}

/**
 * Prefer remote/site image URLs from clipboard HTML (e.g. animated GIFs) over the
 * accompanying File blob, which browsers often flatten to a single PNG frame.
 */
export function extractImageUrlsFromHtml(html: string | undefined): string[] {
  if (!html) return [];

  const doc = parseHtmlDocument(html);
  if (!doc) return [];

  const urls: string[] = [];

  for (const image of doc.querySelectorAll("img[src]")) {
    const raw = image.getAttribute("src");
    if (!raw) continue;
    const normalized = normalizeLinkUrl(raw);
    if (normalized) urls.push(normalized);
  }

  return urls;
}

/**
 * True when clipboard HTML carries meaningful non-image content (text/structure).
 * In that case we insert the HTML via the schema instead of only uploading files.
 */
export function htmlHasRichNonImageContent(html: string | undefined): boolean {
  if (!html?.trim()) return false;

  const doc = parseHtmlDocument(html);
  if (!doc) return false;

  for (const image of doc.querySelectorAll("img")) {
    image.remove();
  }

  // Ignore empty wrappers like `<p><img /></p>` — only leftover text or
  // non-image embeds count as rich clipboard HTML.
  const text = doc.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
  if (text.length > 0) return true;

  return Boolean(doc.body.querySelector("iframe, video, audio, object, embed"));
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

/**
 * Insert dropped/pasted files using the ImageUpload placeholder for images
 * and the media upload queue for audio/attachments.
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

/**
 * Paste pipeline when `consumePasteEvent` is true (we own the whole event):
 * 1. Rich HTML (text/structure) → insert HTML via schema; also attach non-image files
 * 2. HTML with remote image URLs only → insert committed `image` nodes (skip file blobs)
 * 3. Otherwise → local upload placeholders via `insertFilesIntoEditor`
 */
export function handleFilePaste(
  editor: Editor,
  files: File[],
  htmlContent?: string,
  onReject?: (file: File, reason: string) => void
) {
  if (!editor.isEditable) return;

  if (htmlHasRichNonImageContent(htmlContent) && htmlContent) {
    editor.chain().focus().insertContent(htmlContent).run();

    const extraFiles = files.filter((file) => !file.type.startsWith("image/"));
    if (extraFiles.length > 0) {
      insertFilesIntoEditor(editor, extraFiles, { onReject });
    }
    return;
  }

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
 * Extends TipTap FileHandler so drop/paste go through our upload placeholders.
 * `consumePasteEvent` defaults to true to avoid duplicate nodes from Image /
 * HTML paste rules.
 */
export const FileHandler = TiptapFileHandler.extend<FileHandlerOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      allowedMimeTypes: SUPPORTED_MEDIA_MIME_TYPES,
      consumePasteEvent: true,
      onReject: defaultReject,
      onDrop: undefined,
      onPaste: undefined,
    };
  },

  addProseMirrorPlugins() {
    const {
      allowedMimeTypes,
      consumePasteEvent,
      onDrop,
      onPaste,
      onReject = defaultReject,
    } = this.options;

    return [
      FileHandlePlugin({
        key: new PluginKey(this.name),
        editor: this.editor,
        allowedMimeTypes,
        consumePasteEvent: consumePasteEvent ?? true,
        onDrop:
          onDrop ??
          ((editor, files, position) => {
            insertFilesIntoEditor(editor, files, { onReject, position });
          }),
        onPaste:
          onPaste ??
          ((editor, files, htmlContent) => {
            handleFilePaste(editor, files, htmlContent, onReject);
          }),
      }),
    ];
  },
});

export { createImageAltText };
