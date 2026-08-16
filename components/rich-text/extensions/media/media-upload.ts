import type { Editor } from "@tiptap/react";

export type MediaKind = "attachment" | "audio" | "image";
export type MediaUploadStatus = "failed" | "pending" | "uploading";

export interface QueuedMediaUpload {
  error?: string;
  file: File;
  kind: MediaKind;
  status: MediaUploadStatus;
}

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_MEDIA_SIZE = 50 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);
export const ACCEPTED_AUDIO_TYPES = new Set([
  "audio/aac",
  "audio/flac",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
]);

const queuedMediaUploads = new WeakMap<Editor, Map<string, QueuedMediaUpload>>();
let nextUploadId = 0;

function getUploadQueue(editor: Editor) {
  let uploads = queuedMediaUploads.get(editor);

  if (!uploads) {
    uploads = new Map();
    queuedMediaUploads.set(editor, uploads);
  }

  return uploads;
}

export function inferMediaKind(file: File): MediaKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  return "attachment";
}

export function validateMediaFile(file: File, kind = inferMediaKind(file)): string | null {
  if (kind === "image" && !ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return "Choose a PNG, JPG, GIF, WebP, or SVG image.";
  }

  if (kind === "audio" && !ACCEPTED_AUDIO_TYPES.has(file.type)) {
    return "Choose an MP3, M4A, AAC, WAV, FLAC, OGG, or WebM audio file.";
  }

  const maximumSize = kind === "image" ? MAX_IMAGE_SIZE : MAX_MEDIA_SIZE;
  if (file.size > maximumSize) {
    return `${kind === "image" ? "The image" : "The file"} must be ${maximumSize / 1024 / 1024} MB or smaller.`;
  }

  if (file.size === 0) return "The selected file is empty.";
  return null;
}

export function queueMediaUpload(editor: Editor, file: File, kind = inferMediaKind(file)): string {
  nextUploadId += 1;
  const id = `${kind}-upload-${Date.now()}-${nextUploadId}`;

  getUploadQueue(editor).set(id, { file, kind, status: "pending" });
  return id;
}

export function claimMediaUpload(editor: Editor, id: string): QueuedMediaUpload | null {
  const upload = getUploadQueue(editor).get(id);
  if (!upload || upload.status !== "pending") return null;

  upload.status = "uploading";
  return upload;
}

export function getMediaUpload(editor: Editor, id: string): QueuedMediaUpload | null {
  return getUploadQueue(editor).get(id) ?? null;
}

export function releaseMediaUpload(editor: Editor, id: string) {
  const upload = getUploadQueue(editor).get(id);
  if (upload?.status === "uploading") upload.status = "pending";
}

export function failMediaUpload(editor: Editor, id: string, error: string) {
  const upload = getUploadQueue(editor).get(id);
  if (!upload) return;

  upload.error = error;
  upload.status = "failed";
}

export function retryMediaUpload(editor: Editor, id: string): QueuedMediaUpload | null {
  const upload = getUploadQueue(editor).get(id);
  if (!upload) return null;

  upload.error = undefined;
  upload.status = "uploading";
  return upload;
}

export function clearMediaUpload(editor: Editor, id: string) {
  const uploads = queuedMediaUploads.get(editor);
  uploads?.delete(id);
  if (uploads?.size === 0) queuedMediaUploads.delete(editor);
}
