import type { Editor } from "@tiptap/react";
import { describe, expect, it } from "vitest";
import { clearMediaUploads, getMediaUpload, queueMediaUpload } from "./media-upload";

describe("media upload queue", () => {
  it("clears all queued files when an editor is destroyed", () => {
    const editor = {} as Editor;
    const file = new File(["content"], "document.pdf", { type: "application/pdf" });
    const uploadId = queueMediaUpload(editor, file, "attachment");

    expect(getMediaUpload(editor, uploadId)).not.toBeNull();

    clearMediaUploads(editor);

    expect(getMediaUpload(editor, uploadId)).toBeNull();
  });
});
