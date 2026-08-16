import type { Editor } from "@tiptap/react";
import { describe, expect, it } from "vitest";

import {
  claimMediaUpload,
  clearMediaUpload,
  failMediaUpload,
  getMediaUpload,
  inferMediaKind,
  queueMediaUpload,
  retryMediaUpload,
  validateMediaFile,
} from "./media-upload";

describe("media upload queue", () => {
  it.each([
    ["cover.webp", "image/webp", "image"],
    ["episode.mp3", "audio/mpeg", "audio"],
    ["brief.pdf", "application/pdf", "attachment"],
  ] as const)("routes %s through the %s queue", (name, type, kind) => {
    const editor = {} as Editor;
    const file = new File(["media"], name, { type });
    const id = queueMediaUpload(editor, file);

    expect(inferMediaKind(file)).toBe(kind);
    expect(id).toMatch(new RegExp(`^${kind}-upload-`));
    expect(claimMediaUpload(editor, id)).toMatchObject({ file, kind, status: "uploading" });
    failMediaUpload(editor, id, "offline");
    expect(getMediaUpload(editor, id)).toMatchObject({ error: "offline", status: "failed" });
    expect(retryMediaUpload(editor, id)?.status).toBe("uploading");
    clearMediaUpload(editor, id);
    expect(getMediaUpload(editor, id)).toBeNull();
  });

  it("rejects the wrong file type for an audio placeholder", () => {
    expect(
      validateMediaFile(new File(["text"], "notes.txt", { type: "text/plain" }), "audio")
    ).toMatch(/MP3/);
  });
});
