import { beforeEach, describe, expect, it, vi } from "vitest";

import { RICH_TEXT_DOCUMENT_FIXTURE } from "../testing/rich-text-document.fixture";
import { clearRichTextDraft, readRichTextDraft, saveRichTextDraft } from "./editor-draft";

describe("rich text drafts", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("round-trips valid content and sanitizes post metadata", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_723_456_789_000);

    expect(
      saveRichTextDraft("42", RICH_TEXT_DOCUMENT_FIXTURE, {
        categoryId: 4,
        coverImage: "/cover.webp",
        isFeatured: true,
        seriesId: 9,
        seriesOrder: 2,
        slug: "schema-fixture",
        status: "DRAFT",
        summary: "Summary",
        tagIds: [3, 1],
        title: "Schema fixture",
      })
    ).toBe(true);

    expect(readRichTextDraft("42")).toEqual({
      content: RICH_TEXT_DOCUMENT_FIXTURE,
      postData: {
        categoryId: 4,
        coverImage: "/cover.webp",
        isFeatured: true,
        seriesId: 9,
        seriesOrder: 2,
        slug: "schema-fixture",
        status: "DRAFT",
        summary: "Summary",
        tagIds: [3, 1],
        title: "Schema fixture",
      },
      savedAt: 1_723_456_789_000,
      version: 1,
    });
  });

  it("rejects missing IDs and malformed stored drafts", () => {
    expect(saveRichTextDraft(null, RICH_TEXT_DOCUMENT_FIXTURE, {})).toBe(false);
    expect(readRichTextDraft(null)).toBeNull();

    window.localStorage.setItem("odyssey_rich_text_draft:bad", "not-json");
    window.localStorage.setItem(
      "odyssey_rich_text_draft:old",
      JSON.stringify({
        content: RICH_TEXT_DOCUMENT_FIXTURE,
        postData: {},
        savedAt: Date.now(),
        version: 0,
      })
    );

    expect(readRichTextDraft("bad")).toBeNull();
    expect(readRichTextDraft("old")).toBeNull();
  });

  it("clears a saved draft", () => {
    expect(saveRichTextDraft("new", RICH_TEXT_DOCUMENT_FIXTURE, {})).toBe(true);
    clearRichTextDraft("new");
    expect(readRichTextDraft("new")).toBeNull();
  });

  it("fails safely when browser storage is unavailable", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    });

    expect(saveRichTextDraft("new", RICH_TEXT_DOCUMENT_FIXTURE, {})).toBe(false);
  });
});
