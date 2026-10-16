import { describe, expect, it } from "vitest";

import {
  ARTICLE_SHADER_PRESETS,
  presetById,
  presetForSeed,
  resolveArticleShaderPreset,
} from "./article-shader-presets";

describe("article shader presets", () => {
  it("keeps every preset id unique", () => {
    const ids = ARTICLE_SHADER_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(27);
  });

  it("finds a catalog id and misses an unknown one", () => {
    expect(presetById("mesh-aurora")?.id).toBe("mesh-aurora");
    expect(presetById("missing")).toBeNull();
    expect(presetById(null)).toBeNull();
  });

  it("returns the same catalog entry for the same seed", () => {
    const first = presetForSeed("memories-of-grandpa");
    const second = presetForSeed("memories-of-grandpa");
    expect(first).toBe(second);
    expect(ARTICLE_SHADER_PRESETS).toContain(first);
  });
});

describe("resolveArticleShaderPreset", () => {
  it("uses a saved id", () => {
    expect(resolveArticleShaderPreset("mesh-aurora", "another-slug").id).toBe("mesh-aurora");
  });

  it("falls back to the seed for unknown and empty ids", () => {
    const expected = presetForSeed("memories-of-grandpa");
    expect(resolveArticleShaderPreset("retired-preset", "memories-of-grandpa")).toBe(expected);
    expect(resolveArticleShaderPreset(null, "memories-of-grandpa")).toBe(expected);
    expect(resolveArticleShaderPreset("  ", "memories-of-grandpa")).toBe(expected);
  });
});
