import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  articleCoverBackdrop,
  presetForSeed,
  resolveArticleShaderPreset,
} from "@/components/shader-background/article-shader-presets";
import { ArticleAmbientBackground } from "./article-ambient-background";

describe("ArticleAmbientBackground", () => {
  it("paints the selected backdrop and contrast layer without a canvas", () => {
    const slug = "memories-of-grandpa";
    const presetId = "mesh-aurora";
    const preset = resolveArticleShaderPreset(presetId, slug);
    const html = renderToStaticMarkup(createElement(ArticleAmbientBackground, { slug, presetId }));
    expect(html).toContain(articleCoverBackdrop(preset));
    expect(html).toContain("bg-background/72");
    expect(html).not.toContain("<canvas");
  });
});

describe("article ambient preset resolution", () => {
  it("returns the saved catalog preset for the article slug", () => {
    expect(resolveArticleShaderPreset("mesh-aurora", "memories-of-grandpa").id).toBe("mesh-aurora");
  });

  it("uses the same slug default when the article has no saved preset", () => {
    const expected = presetForSeed("memories-of-grandpa");
    expect(resolveArticleShaderPreset(undefined, "memories-of-grandpa")).toBe(expected);
    expect(resolveArticleShaderPreset(null, "memories-of-grandpa")).toBe(expected);
    expect(resolveArticleShaderPreset("retired-preset", "memories-of-grandpa")).toBe(expected);
  });
});
