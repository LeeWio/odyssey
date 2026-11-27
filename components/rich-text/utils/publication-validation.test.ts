import { describe, expect, it } from "vitest";
import { getArticlePublicationProblems } from "./publication-validation";

const plain = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
const image = (alt: string) =>
  JSON.stringify({
    type: "doc",
    content: [{ type: "image", attrs: { src: "/fixture.jpg", alt } }],
  });

describe("article publication validation", () => {
  it("requires alternative text for published images", () => {
    expect(getArticlePublicationProblems(image(""))).toEqual(["missing-alt"]);
    expect(getArticlePublicationProblems(image("A flower"))).toEqual([]);
  });

  it("allows valid documents and reports invalid persisted nodes", () => {
    expect(getArticlePublicationProblems(plain)).toEqual([]);
    const invalid = JSON.stringify({ type: "doc", content: [{ type: "legacyWidget" }] });
    expect(getArticlePublicationProblems(invalid)).toEqual(["invalid-document"]);
  });

  it("blocks an unfinished image upload placeholder", () => {
    const content = JSON.stringify({ type: "doc", content: [{ type: "imageUpload" }] });
    expect(getArticlePublicationProblems(content)).toEqual(["pending-upload"]);
  });
});
