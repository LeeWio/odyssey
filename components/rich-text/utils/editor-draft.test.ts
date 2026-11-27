import { describe, expect, it } from "vitest";

import { sanitizePostData } from "./editor-draft";

describe("article draft metadata", () => {
  it("restores older drafts with the original fields and opaque translation data", () => {
    const translations = {
      zh: { title: "中文标题", content: "正文" },
      en: { title: "English", summary: "Excerpt" },
    };
    expect(
      sanitizePostData({
        title: "Original title",
        summary: "Original excerpt",
        content: "Original document",
        translations,
      })
    ).toEqual({
      title: "Original title",
      summary: "Original excerpt",
      content: "Original document",
      translations,
    });
  });
});
