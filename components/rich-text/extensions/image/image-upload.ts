import type { Editor } from "@tiptap/react";
import {
  claimMediaUpload,
  clearMediaUpload,
  failMediaUpload,
  getMediaUpload,
  queueMediaUpload,
  releaseMediaUpload,
  retryMediaUpload,
  validateMediaFile,
} from "../media/media-upload";

export { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "../media/media-upload";

export function createImageAltText(fileName: string): string {
  const extensionStart = fileName.lastIndexOf(".");
  return extensionStart > 0 ? fileName.slice(0, extensionStart) : fileName;
}

export function validateImageFile(file: File): string | null {
  return validateMediaFile(file, "image");
}

export function queueImageUpload(editor: Editor, file: File): string {
  return queueMediaUpload(editor, file, "image");
}

export function claimImageUpload(editor: Editor, id: string) {
  return claimMediaUpload(editor, id);
}

export function getImageUpload(editor: Editor, id: string) {
  return getMediaUpload(editor, id);
}

export function releaseImageUpload(editor: Editor, id: string) {
  releaseMediaUpload(editor, id);
}

export function markImageUploadFailed(editor: Editor, id: string, error: string) {
  failMediaUpload(editor, id, error);
}

export function retryImageUpload(editor: Editor, id: string) {
  return retryMediaUpload(editor, id);
}

export function clearImageUpload(editor: Editor, id: string) {
  clearMediaUpload(editor, id);
}
