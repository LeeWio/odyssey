import type { Editor } from "@tiptap/react";
import { describe, expect, it } from "vitest";

import {
  MAX_IMAGE_SIZE,
  claimImageUpload,
  clearImageUpload,
  createImageAltText,
  getImageUpload,
  markImageUploadFailed,
  queueImageUpload,
  releaseImageUpload,
  retryImageUpload,
  validateImageFile,
} from "./image-upload";

describe("image upload validation", () => {
  it.each([
    ["photo.jpg", "image/jpeg"],
    ["photo.png", "image/png"],
    ["photo.webp", "image/webp"],
    ["animation.gif", "image/gif"],
    ["vector.svg", "image/svg+xml"],
  ])("accepts %s", (name, type) => {
    expect(validateImageFile(new File(["image"], name, { type }))).toBeNull();
  });

  it("rejects unsupported and oversized files", () => {
    expect(validateImageFile(new File(["text"], "notes.txt", { type: "text/plain" }))).toMatch(
      /PNG/
    );
    expect(
      validateImageFile(
        new File([new Uint8Array(MAX_IMAGE_SIZE + 1)], "large.png", { type: "image/png" })
      )
    ).toMatch(/10 MB/);
  });

  it.each([
    ["article.cover.final.webp", "article.cover.final"],
    ["diagram", "diagram"],
    [".hidden", ".hidden"],
  ])("derives alt text from %s", (fileName, expected) => {
    expect(createImageAltText(fileName)).toBe(expected);
  });
});

describe("image upload queue", () => {
  it("enforces the pending, uploading, failed, retry and clear lifecycle", () => {
    const editor = {} as Editor;
    const file = new File(["image"], "cover.png", { type: "image/png" });
    const id = queueImageUpload(editor, file);

    expect(id).toMatch(/^image-upload-\d+-\d+$/);
    expect(getImageUpload(editor, id)).toMatchObject({ file, status: "pending" });
    expect(claimImageUpload(editor, id)).toMatchObject({ file, status: "uploading" });
    expect(claimImageUpload(editor, id)).toBeNull();

    releaseImageUpload(editor, id);
    expect(getImageUpload(editor, id)?.status).toBe("pending");

    expect(claimImageUpload(editor, id)?.status).toBe("uploading");
    markImageUploadFailed(editor, id, "network error");
    expect(getImageUpload(editor, id)).toMatchObject({ error: "network error", status: "failed" });

    expect(retryImageUpload(editor, id)).toMatchObject({ file, status: "uploading" });
    expect(getImageUpload(editor, id)?.error).toBeUndefined();

    clearImageUpload(editor, id);
    expect(getImageUpload(editor, id)).toBeNull();
  });

  it("keeps queues isolated per editor", () => {
    const firstEditor = {} as Editor;
    const secondEditor = {} as Editor;
    const id = queueImageUpload(
      firstEditor,
      new File(["image"], "cover.png", { type: "image/png" })
    );

    expect(getImageUpload(secondEditor, id)).toBeNull();
    clearImageUpload(firstEditor, id);
  });
});
