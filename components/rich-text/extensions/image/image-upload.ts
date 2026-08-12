import type { Editor } from "@tiptap/react";

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);

type QueuedImageUploadStatus = "failed" | "pending" | "uploading";

interface QueuedImageUpload {
  error?: string;
  file: File;
  status: QueuedImageUploadStatus;
}

const queuedImageUploads = new WeakMap<Editor, Map<string, QueuedImageUpload>>();
let nextUploadId = 0;

function getUploadQueue(editor: Editor) {
  let uploads = queuedImageUploads.get(editor);

  if (!uploads) {
    uploads = new Map();
    queuedImageUploads.set(editor, uploads);
  }

  return uploads;
}

export function createImageAltText(fileName: string): string {
  const extensionStart = fileName.lastIndexOf(".");
  return extensionStart > 0 ? fileName.slice(0, extensionStart) : fileName;
}

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return "Choose a PNG, JPG, GIF, WebP, or SVG image.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "The image must be 10 MB or smaller.";
  }

  return null;
}

export function queueImageUpload(editor: Editor, file: File): string {
  nextUploadId += 1;
  const id = `image-upload-${Date.now()}-${nextUploadId}`;

  getUploadQueue(editor).set(id, { file, status: "pending" });
  return id;
}

export function claimImageUpload(editor: Editor, id: string): QueuedImageUpload | null {
  const upload = getUploadQueue(editor).get(id);

  if (!upload || upload.status !== "pending") return null;

  upload.status = "uploading";
  return upload;
}

export function getImageUpload(editor: Editor, id: string): QueuedImageUpload | null {
  return getUploadQueue(editor).get(id) ?? null;
}

export function releaseImageUpload(editor: Editor, id: string) {
  const upload = getUploadQueue(editor).get(id);

  if (upload?.status === "uploading") {
    upload.status = "pending";
  }
}

export function markImageUploadFailed(editor: Editor, id: string, error: string) {
  const upload = getUploadQueue(editor).get(id);

  if (upload) {
    upload.error = error;
    upload.status = "failed";
  }
}

export function retryImageUpload(editor: Editor, id: string): QueuedImageUpload | null {
  const upload = getUploadQueue(editor).get(id);

  if (!upload) return null;

  upload.error = undefined;
  upload.status = "uploading";
  return upload;
}

export function clearImageUpload(editor: Editor, id: string) {
  const uploads = queuedImageUploads.get(editor);

  uploads?.delete(id);
  if (uploads?.size === 0) queuedImageUploads.delete(editor);
}
