import type { Editor } from "@tiptap/react";
import { describe, expect, it, vi } from "vitest";
import {
  extractImageUrlsFromHtml,
  handleFilePaste,
  htmlHasRichNonImageContent,
  insertFilesIntoEditor,
} from "./file-handler";
import { clearMediaUploads, getMediaUpload } from "../media/media-upload";
import { takePendingImageFile } from "../ImageUpload/pending-files";

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
});

describe("htmlHasRichNonImageContent", () => {
  it("is false for image-only clipboard HTML", () => {
    expect(htmlHasRichNonImageContent('<p><img src="https://cdn.example.com/a.gif" /></p>')).toBe(
      false
    );
  });

  it("is true when HTML still has text after images are removed", () => {
    expect(
      htmlHasRichNonImageContent(
        '<p>Hello from the web</p><img src="https://cdn.example.com/a.png" />'
      )
    ).toBe(true);
  });
});

describe("insertFilesIntoEditor", () => {
  it("inserts imageUpload placeholders for images and media nodes for attachments", () => {
    const editor = createEditorMock();
    const onReject = vi.fn();
    const image = new File(["img"], "photo.png", { type: "image/png" });
    const pdf = new File(["%PDF"], "spec.pdf", { type: "application/pdf" });
    const empty = new File([], "empty.png", { type: "image/png" });

    insertFilesIntoEditor(editor, [image, pdf, empty], { onReject });

    expect(onReject).toHaveBeenCalledOnce();
    expect(editor.insertContent).toHaveBeenCalledWith([
      expect.objectContaining({
        type: "imageUpload",
        attrs: expect.objectContaining({ fileKey: expect.any(String) }),
      }),
      expect.objectContaining({
        type: "attachment",
        attrs: expect.objectContaining({
          fileName: "spec.pdf",
          uploadId: expect.any(String),
        }),
      }),
    ]);

    const inserted = editor.insertContent.mock.calls.at(0)?.at(0) as
      Array<{ type: string; attrs: Record<string, string> }> | undefined;
    expect(inserted?.length).toBe(2);
    expect(takePendingImageFile(inserted![0]!.attrs.fileKey)?.name).toBe("photo.png");
    expect(getMediaUpload(editor, String(inserted![1]!.attrs.uploadId))).not.toBeNull();
    clearMediaUploads(editor);
  });

  it("prefers html image URLs over clipboard files on paste", () => {
    const editor = createEditorMock();
    const file = new File(["frame"], "frame.png", { type: "image/png" });

    handleFilePaste(editor, [file], '<img src="https://cdn.example.com/animated.gif" alt="" />');

    expect(editor.insertContent).toHaveBeenCalledWith([
      {
        type: "image",
        attrs: {
          src: "https://cdn.example.com/animated.gif",
          alt: "",
          caption: "",
          alignment: "center",
          widthPercent: 100,
        },
      },
    ]);
  });

  it("inserts rich HTML via schema and still attaches non-image files", () => {
    const editor = createEditorMock();
    const image = new File(["frame"], "frame.png", { type: "image/png" });
    const pdf = new File(["%PDF"], "notes.pdf", { type: "application/pdf" });
    const html = '<p>Copied article</p><img src="https://cdn.example.com/hero.png" />';

    handleFilePaste(editor, [image, pdf], html);

    expect(editor.insertContent).toHaveBeenNthCalledWith(1, html);
    expect(editor.insertContent).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({
        type: "attachment",
        attrs: expect.objectContaining({ fileName: "notes.pdf" }),
      }),
    ]);
    clearMediaUploads(editor);
  });

  it("does nothing when the editor is read-only", () => {
    const editor = createEditorMock({ isEditable: false });
    insertFilesIntoEditor(editor, [new File(["img"], "photo.png", { type: "image/png" })]);
    expect(editor.chain).not.toHaveBeenCalled();
  });
});
