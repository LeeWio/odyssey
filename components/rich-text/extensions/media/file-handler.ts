import { FileHandler } from "@tiptap/extension-file-handler";
import type { Editor, JSONContent } from "@tiptap/react";

import { createImageAltText } from "../image/image-upload";
import {
  failMediaUpload,
  inferMediaKind,
  queueMediaUpload,
  validateMediaFile,
} from "./media-upload";

function createMediaNode(editor: Editor, file: File): JSONContent {
  const kind = inferMediaKind(file);
  const uploadId = queueMediaUpload(editor, file, kind);
  const validationError = validateMediaFile(file, kind);

  if (validationError) failMediaUpload(editor, uploadId, validationError);

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

function insertFiles(editor: Editor, files: File[], position?: number) {
  if (files.length === 0) return;

  const content = files.map((file) => createMediaNode(editor, file));
  const chain = editor.chain().focus();

  if (typeof position === "number") {
    chain.insertContentAt(position, content).run();
  } else {
    chain.insertContent(content).run();
  }
}

export const MediaFileHandler = FileHandler.configure({
  consumePasteEvent: true,
  onDrop: (editor, files, position) => insertFiles(editor, files, position),
  onPaste: (editor, files) => insertFiles(editor, files),
});
