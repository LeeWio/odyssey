import type { Editor } from "@tiptap/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildFileInsertContent,
  extractImageUrlsFromHtml,
  handleFilePaste,
  insertFilesIntoEditor,
} from "./file-handler";
import { clearMediaUploads, getMediaUpload } from "./media-upload";

function createEditorMock(overrides: Partial<Editor> = {}) {
  const run = vi.fn();
  const insertContent = vi.fn(() => ({ run }));
  const insertContentAt = vi.fn(() => ({ run }));
  const focus = vi.fn(() => ({ insertContent, insertContentAt }));
  const chain = vi.fn(() => ({ focus }));

  return {
    isEditable: true,
    chain,
    focus,
    insertContent,
    insertContentAt,
    run,
    ...overrides,
  } as unknown as Editor & {
    chain: typeof chain;
    focus: typeof focus;
    insertContent: typeof insertContent;
    insertContentAt: typeof insertContentAt;
    run: typeof run;
  };
}

describe("extractImageUrlsFromHtml", () => {
  it("returns normalized http(s) and relative image URLs", () => {
    const html = `
      <div>
        <img src="https://cdn.example.com/a.png" />
        <img src="/uploads/b.jpg" />
        <img src="javascript:alert(1)" />
      </div>
    `;

    expect(extractImageUrlsFromHtml(html)).toEqual([
      "https://cdn.example.com/a.png",
      "/uploads/b.jpg",
    ]);
  });

  it("returns an empty list for missing or invalid html", () => {
    expect(extractImageUrlsFromHtml(undefined)).toEqual([]);
    expect(extractImageUrlsFromHtml("")).toEqual([]);
  });
});

describe("buildFileInsertContent", () => {
  afterEach(() => {
    // no-op; editors are plain objects
  });

  it("queues valid files and skips invalid ones", () => {
    const editor = createEditorMock();
    const onReject = vi.fn();
    const image = new File(["img"], "photo.png", { type: "image/png" });
    const empty = new File([], "empty.png", { type: "image/png" });

    const content = buildFileInsertContent(editor, [image, empty], onReject);

    expect(content).toHaveLength(1);
    expect(content[0]).toMatchObject({
      type: "image",
      attrs: { uploadId: expect.any(String) },
    });
    expect(onReject).toHaveBeenCalledOnce();
    expect(getMediaUpload(editor, String(content[0]?.attrs?.uploadId))).not.toBeNull();
    clearMediaUploads(editor);
  });

  it("creates attachment nodes for non-image non-audio files", () => {
    const editor = createEditorMock();
    const pdf = new File(["%PDF"], "spec.pdf", { type: "application/pdf" });

    const content = buildFileInsertContent(editor, [pdf]);

    expect(content).toEqual([
      expect.objectContaining({
        type: "attachment",
        attrs: expect.objectContaining({
          fileName: "spec.pdf",
          mimeType: "application/pdf",
          uploadId: expect.any(String),
        }),
      }),
    ]);
    clearMediaUploads(editor);
  });
});

describe("handleFilePaste / insertFilesIntoEditor", () => {
  it("prefers html image URLs over clipboard files", () => {
    const editor = createEditorMock();
    const file = new File(["frame"], "frame.png", { type: "image/png" });

    handleFilePaste(editor, [file], '<img src="https://cdn.example.com/animated.gif" alt="" />');

    expect(editor.chain).toHaveBeenCalled();
    expect(editor.insertContent).toHaveBeenCalledWith([
      {
        type: "image",
        attrs: { alt: "", caption: "", src: "https://cdn.example.com/animated.gif" },
      },
    ]);
    expect(editor.run).toHaveBeenCalled();
  });

  it("does nothing when the editor is read-only", () => {
    const editor = createEditorMock({ isEditable: false });
    const onReject = vi.fn();
    const file = new File(["img"], "photo.png", { type: "image/png" });

    insertFilesIntoEditor(editor, [file], { onReject });
    handleFilePaste(editor, [file], undefined, onReject);

    expect(editor.chain).not.toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
  });

  it("inserts at the drop position when provided", () => {
    const editor = createEditorMock();
    const file = new File(["img"], "photo.png", { type: "image/png" });

    insertFilesIntoEditor(editor, [file], { position: 12 });

    expect(editor.insertContentAt).toHaveBeenCalledWith(12, [
      expect.objectContaining({
        type: "image",
        attrs: expect.objectContaining({ uploadId: expect.any(String) }),
      }),
    ]);
    clearMediaUploads(editor);
  });
});
