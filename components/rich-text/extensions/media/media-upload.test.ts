import type { Editor } from "@tiptap/react";
import { describe, expect, it, vi } from "vitest";
import {
  claimMediaUpload,
  clearMediaUploads,
  failMediaUpload,
  getMediaUpload,
  queueMediaUpload,
  registerMediaUploadAbort,
  retryMediaUpload,
} from "./media-upload";

describe("media upload queue", () => {
  it("clears all queued files when an editor is destroyed", () => {
    const editor = {} as Editor;
    const file = new File(["content"], "document.pdf", { type: "application/pdf" });
    const uploadId = queueMediaUpload(editor, file, "attachment");

    expect(getMediaUpload(editor, uploadId)).not.toBeNull();

    clearMediaUploads(editor);

    expect(getMediaUpload(editor, uploadId)).toBeNull();
  });

  it("aborts active uploads when an editor is destroyed", () => {
    const editor = {} as Editor;
    const file = new File(["audio"], "voice.mp3", { type: "audio/mpeg" });
    const uploadId = queueMediaUpload(editor, file, "audio");
    const abort = vi.fn();

    expect(claimMediaUpload(editor, uploadId)).not.toBeNull();
    registerMediaUploadAbort(editor, uploadId, abort);
    clearMediaUploads(editor);

    expect(abort).toHaveBeenCalledOnce();
    expect(getMediaUpload(editor, uploadId)).toBeNull();
  });

  it("only retries failed uploads", () => {
    const editor = {} as Editor;
    const file = new File(["audio"], "voice.mp3", { type: "audio/mpeg" });
    const uploadId = queueMediaUpload(editor, file, "audio");

    expect(retryMediaUpload(editor, uploadId)).toBeNull();
    expect(claimMediaUpload(editor, uploadId)?.status).toBe("uploading");
    expect(retryMediaUpload(editor, uploadId)).toBeNull();

    failMediaUpload(editor, uploadId, "Upload failed.");

    expect(retryMediaUpload(editor, uploadId)).toMatchObject({
      error: undefined,
      status: "uploading",
    });
  });

  it("does not abort a request after the upload has failed", () => {
    const editor = {} as Editor;
    const file = new File(["audio"], "voice.mp3", { type: "audio/mpeg" });
    const uploadId = queueMediaUpload(editor, file, "audio");
    const abort = vi.fn();

    claimMediaUpload(editor, uploadId);
    registerMediaUploadAbort(editor, uploadId, abort);
    failMediaUpload(editor, uploadId, "Upload failed.");
    clearMediaUploads(editor);

    expect(abort).not.toHaveBeenCalled();
  });
});
