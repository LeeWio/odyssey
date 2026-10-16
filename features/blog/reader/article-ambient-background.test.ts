import { describe, expect, it } from "vitest";

import { SHADER_BACKGROUND_VARIANTS } from "@/components/background/shader-background";

import { getAmbientConfig } from "./article-ambient-background";

const STATIC_VARIANTS = new Set(["dot-grid", "waves"]);

describe("getAmbientConfig", () => {
  it("keeps the same ink and mist for the same article", () => {
    const first = getAmbientConfig("memories-of-grandpa");
    const second = getAmbientConfig("memories-of-grandpa");

    expect(first.ink).toBe(second.ink);
    expect(first.mist).toBe(second.mist);
    expect(first.variant).toBe(second.variant);
  });

  it("can land on every supported background and keeps animated ones moving", () => {
    const seen = new Set<string>();

    for (let index = 0; index < 400; index += 1) {
      const config = getAmbientConfig(`article-${index}`);
      seen.add(config.variant);
      if (STATIC_VARIANTS.has(config.variant)) continue;
      expect("speed" in config && typeof config.speed === "number" && config.speed).toBeGreaterThan(
        0.15
      );
    }

    expect([...seen].sort()).toEqual([...SHADER_BACKGROUND_VARIANTS].sort());
  });

  it("takes the fade colors from the shader palette", () => {
    const tone = getAmbientConfig("odyssey-notes");

    expect(tone.ink).toMatch(/^#[0-9a-f]{6}$/);
    expect(tone.mist).toMatch(/^#[0-9a-f]{6}$/);
    expect(tone.ink).not.toBe(tone.mist);
    expect("colors" in tone && Array.isArray(tone.colors) && tone.colors[0]).toBeTruthy();
  });
});
