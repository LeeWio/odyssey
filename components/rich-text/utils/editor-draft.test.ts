import { describe, expect, it } from "vitest";

import { editablePostTranslations, sanitizePostData } from "./editor-draft";

describe("source post translations", () => {
  it("keeps only non-source locales for editing and saving", () => {
    expect(
      editablePostTranslations({
        zh: { title: "中文", content: "正文" },
        en: { title: "English", content: "Body" },
      })
    ).toEqual({
      en: { title: "English", content: "Body" },
    });
  });

  it("drops a stored Chinese translation from a local draft", () => {
    expect(
      sanitizePostData({
        title: "中文标题",
        translations: {
          zh: { title: "中文标题", content: "正文" },
          en: { title: "English", summary: "Excerpt" },
        },
      })?.translations
    ).toEqual({
      en: { title: "English", summary: "Excerpt" },
    });
  });
});
