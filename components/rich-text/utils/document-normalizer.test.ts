import { describe, expect, it } from "vitest";

import { RICH_TEXT_DOCUMENT_FIXTURE } from "../testing/rich-text-document.fixture";
import {
  EMPTY_DOC,
  getMediaValidationIssues,
  hasPendingMediaUploads,
  hasPendingImageUploads,
  normalizeJSONContent,
  normalizeRichTextDocument,
  parseJSONContent,
  removeTemporaryImageAttributes,
  removeTemporaryMediaAttributes,
} from "./document-normalizer";

describe("parseJSONContent", () => {
  it("accepts object and serialized document trees", () => {
    expect(parseJSONContent(RICH_TEXT_DOCUMENT_FIXTURE)).toEqual(RICH_TEXT_DOCUMENT_FIXTURE);
    expect(parseJSONContent(JSON.stringify(RICH_TEXT_DOCUMENT_FIXTURE))).toEqual(
      RICH_TEXT_DOCUMENT_FIXTURE
    );
  });

  it.each([
    null,
    {},
    { type: "paragraph", content: [] },
    { type: "doc", content: "invalid" },
    { type: "doc", content: [{ type: 42 }] },
    { type: "doc", content: [{ type: "text", text: 42 }] },
    { type: "doc", content: [{ type: "text", marks: [{ attrs: {} }] }] },
    "not json",
  ])("rejects malformed content: %j", (value) => {
    expect(parseJSONContent(value)).toBeNull();
  });
});

describe("normalizeRichTextDocument", () => {
  it("creates deterministic unique heading anchors and sanitizes links", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2, id: "stale" },
          content: [{ type: "text", text: "Café roadmap" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Café roadmap" }],
        },
        { type: "heading", attrs: { level: 2 } },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)", target: "_blank" } }],
              text: "unsafe",
            },
            {
              type: "text",
              marks: [{ type: "link", attrs: { href: "/safe", target: "_self" } }],
              text: "safe",
            },
          ],
        },
      ],
    };
    const original = structuredClone(input);
    const normalized = normalizeRichTextDocument(input);

    expect(normalized.content?.slice(0, 3).map((node) => node.attrs?.id)).toEqual([
      "cafe-roadmap",
      "cafe-roadmap-2",
      "section-3",
    ]);
    expect(normalized.content?.[3].content?.[0].marks).toEqual([]);
    expect(normalized.content?.[3].content?.[1].marks).toEqual([
      { type: "link", attrs: { href: "/safe" } },
    ]);
    expect(input).toEqual(original);
  });

  it("falls back to the canonical empty document", () => {
    expect(normalizeJSONContent(undefined)).toEqual(EMPTY_DOC);
    expect(normalizeJSONContent({ type: "doc", content: [] })).toEqual(EMPTY_DOC);
  });
});

describe("temporary image attributes", () => {
  const documentWithUpload = {
    type: "doc",
    content: [
      { type: "paragraph" },
      {
        type: "image",
        attrs: { alt: "Preview", src: "blob:test", uploadId: "upload-1" },
      },
    ],
  };

  it("detects pending uploads recursively", () => {
    expect(hasPendingImageUploads(documentWithUpload)).toBe(true);
    expect(hasPendingImageUploads(EMPTY_DOC)).toBe(false);
  });

  it("removes only temporary upload attributes without mutating input", () => {
    const cleaned = removeTemporaryImageAttributes(documentWithUpload);

    expect(cleaned.content?.[1].attrs).toEqual({ alt: "Preview", src: "blob:test" });
    expect(documentWithUpload.content[1].attrs?.uploadId).toBe("upload-1");
  });
});

describe("media publication validation", () => {
  it("detects pending uploads across every binary media node", () => {
    const document = {
      type: "doc",
      content: [
        { type: "audio", attrs: { src: null, uploadId: "audio-upload-1" } },
        { type: "attachment", attrs: { src: null, uploadId: "attachment-upload-1" } },
      ],
    };

    expect(hasPendingMediaUploads(document)).toBe(true);
    expect(getMediaValidationIssues(document)).toEqual(
      expect.arrayContaining([
        { code: "pending-upload", nodeType: "audio" },
        { code: "pending-upload", nodeType: "attachment" },
      ])
    );
  });

  it("requires image alt text and valid completed media sources before publication", () => {
    const document = {
      type: "doc",
      content: [
        { type: "image", attrs: { alt: "", src: "/cover.webp" } },
        { type: "audio", attrs: { src: "" } },
        { type: "youtube", attrs: { src: "https://example.com/video" } },
      ],
    };

    expect(getMediaValidationIssues(document)).toEqual([
      { code: "missing-alt", nodeType: "image" },
      { code: "missing-source", nodeType: "audio" },
      { code: "invalid-youtube", nodeType: "youtube" },
    ]);
  });

  it("accepts complete image, audio, attachment and YouTube nodes", () => {
    expect(getMediaValidationIssues(RICH_TEXT_DOCUMENT_FIXTURE)).toEqual([]);
  });

  it("removes temporary ids without stripping persistent media metadata", () => {
    const content = {
      type: "attachment",
      attrs: {
        fileName: "notes.pdf",
        src: "/notes.pdf",
        uploadId: "attachment-upload-1",
      },
    };

    expect(removeTemporaryMediaAttributes(content).attrs).toEqual({
      fileName: "notes.pdf",
      src: "/notes.pdf",
    });
  });
});
