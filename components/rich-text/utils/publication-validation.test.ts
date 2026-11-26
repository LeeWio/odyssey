import { describe, expect, it } from "vitest";
import { getArticlePublicationProblems } from "./publication-validation";

const plain = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
const image = (alt: string) =>
  JSON.stringify({
    type: "doc",
    content: [{ type: "image", attrs: { src: "/fixture.jpg", alt } }],
  });

describe("article publication validation", () => {
  it("checks saved translations even while editing the primary language", () => {
    expect(
      getArticlePublicationProblems({
        content: plain,
        translations: { en: { title: "Draft", content: image("") } },
      })
    ).toEqual([{ locale: "en", code: "missing-alt" }]);
  });

  it("allows optional untranslated content and reports invalid persisted nodes", () => {
    expect(
      getArticlePublicationProblems({
        content: plain,
        translations: { en: { title: "Draft", content: "" } },
      })
    ).toEqual([]);
    expect(
      getArticlePublicationProblems({
        content: JSON.stringify({ type: "doc", content: [{ type: "legacyWidget" }] }),
        translations: { en: { title: "Draft", content: image("A flower") } },
      })
    ).toEqual([{ locale: "zh", code: "invalid-document" }]);
  });
  it("blocks an unfinished image upload placeholder", () => {
    const content = JSON.stringify({ type: "doc", content: [{ type: "imageUpload" }] });
    expect(getArticlePublicationProblems({ content })).toEqual([
      { locale: "zh", code: "pending-upload" },
    ]);
  });
});
