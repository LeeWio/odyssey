import { describe, expect, it } from "vitest";

import {
  presetById,
  resolveArticleShaderPreset,
} from "@/components/shader-background/article-shader-presets";

describe("ArticleCover preset resolution", () => {
  it("uses the saved catalog preset for a list cover", () => {
    const preset = resolveArticleShaderPreset("mesh-aurora", "memories-of-grandpa");
    expect(preset.id).toBe("mesh-aurora");
    expect(preset.config).toHaveProperty("speed");
  });

  it("keeps a preset without speed free of a synthetic speed", () => {
    const preset = resolveArticleShaderPreset("dot-grid", "notes");
    expect(preset).toBe(presetById("dot-grid"));
    expect(preset.config).not.toHaveProperty("speed");
  });
});
