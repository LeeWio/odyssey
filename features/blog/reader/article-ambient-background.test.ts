import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  presetForSeed,
  resolveArticleShaderPreset,
} from "@/components/shader-background/article-shader-presets";

describe("ArticleAmbientBackground", () => {
  it("keeps a blurred shader behind the reading page", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "article-ambient-background.tsx"),
      "utf8"
    );
    expect(source).toContain("<ShaderBackground");
    expect(source).toContain("speed * 0.4");
    expect(source).toContain("[&_canvas]:[filter:blur(64px)_saturate(1.5)]");
    expect(source).toContain("bg-background/72");
    expect(source).not.toContain("ShaderBackgroundView");
    expect(source).not.toContain("preset.swatch");
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
