import type { ShaderBackgroundProps } from "@/components/background/shader-background";

export type ShaderPresetGroupId = "mesh" | "grain" | "field" | "pattern";

export type ArticleShaderPreset = {
  id: string;
  label: string;
  /** Unique color used by ColorSwatchPicker. It identifies the preset. */
  swatch: string;
  config: ShaderBackgroundProps;
};

export type ShaderPresetGroup = {
  id: ShaderPresetGroupId;
  label: string;
  presetIds: readonly ArticleShaderPreset["id"][];
};

function preset(
  id: string,
  label: string,
  swatch: string,
  config: ShaderBackgroundProps
): ArticleShaderPreset {
  return { id, label, swatch, config };
}

export const ARTICLE_SHADER_PRESETS = [
  preset("mesh-gradient", "Mesh", "#241d9a", {
    variant: "mesh-gradient",
    colors: ["#e0eaff", "#241d9a", "#f75092", "#9f50d3"],
    distortion: 0.8,
    swirl: 0.3,
    speed: 0.4,
  }),
  preset("mesh-aurora", "Mesh — Aurora", "#00ffb2", {
    variant: "mesh-gradient",
    colors: ["#00ffb2", "#0072ff", "#a200ff", "#001a2c"],
    distortion: 0.6,
    swirl: 0.5,
    speed: 0.3,
  }),
  preset("mesh-citrus", "Mesh — Citrus", "#fff200", {
    variant: "mesh-gradient",
    colors: ["#fff200", "#ff8a00", "#ff3d00", "#ffe08a"],
    distortion: 0.7,
    swirl: 0.4,
    speed: 0.5,
  }),
  preset("static-mesh-gradient", "Static Mesh", "#ff8a3d", {
    variant: "static-mesh-gradient",
    colors: ["#ff8a3d", "#ff3d9a", "#3d5aff", "#0a0a0a"],
  }),
  preset("static-mesh-dusk", "Static Mesh — Dusk", "#7597de", {
    variant: "static-mesh-gradient",
    colors: ["#2b1055", "#7597de", "#f6a1c8", "#0d0221"],
  }),
  preset("grain-gradient", "Grain", "#7300ff", {
    variant: "grain-gradient",
    colors: ["#7300ff", "#eba8ff", "#00bfff", "#2a00ff"],
    colorBack: "#000000",
    softness: 0.6,
    speed: 0.5,
  }),
  preset("grain-sunset", "Grain — Sunset", "#ff7a00", {
    variant: "grain-gradient",
    colors: ["#ff7a00", "#ff2e93", "#ffce54", "#8a2be2"],
    colorBack: "#1a0500",
    softness: 0.7,
    speed: 0.4,
  }),
  preset("grain-pastel", "Grain — Pastel", "#ffd6e8", {
    variant: "grain-gradient",
    colors: ["#ffd6e8", "#c9e4ff", "#fff3c4", "#d9c9ff"],
    colorBack: "#ffffff",
    softness: 0.85,
    speed: 0.3,
  }),
  preset("dithering", "Dither", "#00ff9d", {
    variant: "dithering",
    colorBack: "#000000",
    colorFront: "#00ff9d",
    speed: 0.4,
  }),
  preset("warp", "Warp", "#9470ff", {
    variant: "warp",
    colors: ["#121212", "#9470ff", "#121212", "#8838ff"],
    speed: 0.4,
  }),
  preset("waves", "Waves", "#ffbb00", {
    variant: "waves",
    colorFront: "#ffbb00",
    colorBack: "#000000",
  }),
  preset("water", "Water", "#909090", {
    variant: "water",
    colorBack: "#909090",
    colorHighlight: "#ffffff",
    speed: 0.4,
  }),
  preset("swirl", "Swirl", "#ff8a8a", {
    variant: "swirl",
    colorBack: "#180018",
    colors: ["#ffd1d1", "#ff8a8a", "#660000"],
    speed: 0.2,
  }),
  preset("smoke-ring", "Smoke", "#d8d8d8", {
    variant: "smoke-ring",
    colorBack: "#000000",
    colors: ["#ffffff"],
    speed: 0.3,
  }),
  preset("static-radial-gradient", "Radial", "#00bbff", {
    variant: "static-radial-gradient",
    colorBack: "#000000",
    colors: ["#00bbff", "#00ffe1", "#ffffff"],
  }),
  preset("radial-ember", "Radial — Ember", "#ff5100", {
    variant: "static-radial-gradient",
    colorBack: "#0a0000",
    colors: ["#ff5100", "#ffce00", "#4a0000"],
  }),
  preset("neuro-noise", "Neuro", "#47a6ff", {
    variant: "neuro-noise",
    colorFront: "#ffffff",
    colorMid: "#47a6ff",
    colorBack: "#000000",
    speed: 0.4,
  }),
  preset("metaballs", "Metaballs", "#ff5cf4", {
    variant: "metaballs",
    colors: ["#ff5cf4", "#4d9eff", "#000000"],
    colorBack: "#000000",
    speed: 0.5,
  }),
  preset("god-rays", "Rays", "#ff6a00", {
    variant: "god-rays",
    colors: ["#ffcc66", "#ff6a00"],
    colorBack: "#000000",
    speed: 0.4,
  }),
  preset("spiral", "Spiral", "#7a5cff", {
    variant: "spiral",
    colorBack: "#000000",
    colorFront: "#ff5ca6",
    speed: 0.4,
  }),
  preset("pulsing-border", "Pulse", "#00e5ff", {
    variant: "pulsing-border",
    colors: ["#00e5ff", "#7000ff", "#ff00c8"],
    colorBack: "#000000",
    speed: 0.5,
  }),
  preset("color-panels", "Panels", "#3d7aff", {
    variant: "color-panels",
    colors: ["#ff3d68", "#ffb800", "#3d7aff", "#00ffb2"],
    speed: 0.3,
  }),
  preset("simplex-noise", "Simplex", "#ff6ec7", {
    variant: "simplex-noise",
    colors: ["#ff6ec7", "#6ec7ff", "#000000"],
    speed: 0.4,
  }),
  preset("perlin-noise", "Perlin", "#00ffd5", {
    variant: "perlin-noise",
    colorFront: "#00ffd5",
    colorBack: "#000000",
    speed: 0.3,
  }),
  preset("voronoi", "Voronoi", "#ff8247", {
    variant: "voronoi",
    colors: ["#ff8247", "#ffe53d"],
    speed: 0.3,
  }),
  preset("dot-orbit", "Orbit", "#ff6200", {
    variant: "dot-orbit",
    colors: ["#ffc96b", "#ff6200", "#ff2f00"],
    colorBack: "#000000",
    speed: 0.6,
  }),
  preset("dot-grid", "Grid", "#ffaa00", {
    variant: "dot-grid",
    colorBack: "#000000",
    colorFill: "#ffffff",
    colorStroke: "#ffaa00",
  }),
] as const satisfies readonly ArticleShaderPreset[];

const PRESET_BY_ID = new Map(ARTICLE_SHADER_PRESETS.map((item) => [item.id, item]));

export const SHADER_PRESET_GROUPS = [
  {
    id: "mesh",
    label: "Mesh",
    presetIds: [
      "mesh-gradient",
      "mesh-aurora",
      "mesh-citrus",
      "static-mesh-gradient",
      "static-mesh-dusk",
    ],
  },
  {
    id: "grain",
    label: "Grain",
    presetIds: ["grain-gradient", "grain-sunset", "grain-pastel", "dithering"],
  },
  {
    id: "field",
    label: "Field",
    presetIds: [
      "warp",
      "waves",
      "water",
      "swirl",
      "smoke-ring",
      "static-radial-gradient",
      "radial-ember",
      "neuro-noise",
      "metaballs",
      "god-rays",
      "spiral",
      "pulsing-border",
      "color-panels",
      "simplex-noise",
      "perlin-noise",
    ],
  },
  {
    id: "pattern",
    label: "Pattern",
    presetIds: ["voronoi", "dot-orbit", "dot-grid"],
  },
] as const satisfies readonly ShaderPresetGroup[];

export function presetById(id: string | null | undefined): ArticleShaderPreset | null {
  if (!id) return null;
  return PRESET_BY_ID.get(id) ?? null;
}

function hashSeed(value: string) {
  return Array.from(value).reduce(
    (hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619),
    2166136261
  );
}

/** Same seed always lands on the same catalog entry. */
export function presetForSeed(seed: string): ArticleShaderPreset {
  const index = hashSeed(seed || "article") % ARTICLE_SHADER_PRESETS.length;
  return ARTICLE_SHADER_PRESETS[index] ?? ARTICLE_SHADER_PRESETS[0];
}

/** A saved id wins. Unknown and empty ids fall back to the slug default. */
export function resolveArticleShaderPreset(
  presetId: string | null | undefined,
  seed: string
): ArticleShaderPreset {
  return presetById(presetId) ?? presetForSeed(seed);
}

export function presetsInGroup(groupId: ShaderPresetGroupId): ArticleShaderPreset[] {
  const group = SHADER_PRESET_GROUPS.find((item) => item.id === groupId);
  if (!group) return [];
  return group.presetIds.flatMap((id) => {
    const item = presetById(id);
    return item ? [item] : [];
  });
}

export function groupForPreset(id: string): ShaderPresetGroup | null {
  return (
    SHADER_PRESET_GROUPS.find((group) => (group.presetIds as readonly string[]).includes(id)) ??
    null
  );
}
