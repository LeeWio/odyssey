"use client";

import { useMemo } from "react";

import {
  SHADER_BACKGROUND_VARIANTS,
  ShaderBackground,
  type ShaderBackgroundProps,
  type ShaderBackgroundVariant,
} from "@/components/background/shader-background";

const MOTION_SPEED = [0.16, 0.3] as const;

const PALETTES = {
  blue: ["#0b1220", "#16243a", "#31506a", "#5f7180"],
  teal: ["#0b1c1e", "#143439", "#2f5554", "#6a7770"],
  sunset: ["#1c1314", "#372326", "#62413a", "#8f6853"],
  pastel: ["#171a26", "#283246", "#4a5261", "#756d76"],
  aurora: ["#101b1d", "#18363a", "#38514c", "#6b7668"],
  citrus: ["#192018", "#2c3a2a", "#59604a", "#8b7559"],
  violet: ["#1a1721", "#302637", "#594455", "#806a6b"],
  graphite: ["#101417", "#20282d", "#3f4b50", "#667078"],
} as const;

function hashSeed(value: string) {
  return Array.from(value).reduce(
    (hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619),
    2166136261
  );
}

function seededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function range(random: () => number, min: number, max: number) {
  return min + random() * (max - min);
}

function integer(random: () => number, min: number, max: number) {
  return Math.floor(range(random, min, max + 1));
}

function pick<T>(random: () => number, values: readonly T[]) {
  return values[Math.floor(random() * values.length)];
}

export type AmbientTone = {
  ink: string;
  mist: string;
};

function ambientTone(colors: readonly string[], fallbackInk: string): AmbientTone {
  return {
    ink: colors[0] ?? fallbackInk,
    mist: colors[colors.length - 1] ?? colors[0] ?? fallbackInk,
  };
}

function motion(random: () => number) {
  return range(random, MOTION_SPEED[0], MOTION_SPEED[1]);
}

function colorsOf(random: () => number, count = 4) {
  const palette = pick(random, Object.values(PALETTES));
  return [...palette].slice(0, count);
}

/**
 * The seed fixes the variant, palette, and motion. The same article therefore
 * keeps one background across visits. Variants without a time axis stay still.
 */
export function getAmbientConfig(seed: string): ShaderBackgroundProps & AmbientTone {
  const random = seededRandom(hashSeed(seed));
  const variant = pick(random, SHADER_BACKGROUND_VARIANTS);

  return configForVariant(variant, random);
}

function configForVariant(
  variant: ShaderBackgroundVariant,
  random: () => number
): ShaderBackgroundProps & AmbientTone {
  const colors = colorsOf(random);

  switch (variant) {
    case "mesh-gradient":
      return {
        ...ambientTone(colors, "#0b1220"),
        variant,
        colors,
        distortion: range(random, 0.35, 0.7),
        grainMixer: range(random, 0.02, 0.08),
        grainOverlay: range(random, 0.01, 0.04),
        speed: motion(random),
        swirl: range(random, 0.25, 0.6),
      };
    case "grain-gradient":
      return {
        ...ambientTone(colors, "#0b1220"),
        variant,
        colorBack: colors[0],
        colors,
        intensity: range(random, 0.25, 0.5),
        noise: range(random, 0.06, 0.16),
        shape: pick(random, ["wave", "ripple", "blob", "sphere"]),
        softness: range(random, 0.55, 0.85),
        speed: motion(random),
      };
    case "dot-grid":
      return {
        ...ambientTone(colors, "#101417"),
        variant,
        colorBack: colors[0],
        colorFill: colors[2] ?? colors[1],
        colorStroke: colors[3] ?? colors[1],
        gapX: range(random, 18, 42),
        gapY: range(random, 18, 42),
        opacityRange: range(random, 0.1, 0.4),
        shape: pick(random, ["circle", "diamond", "square"]),
        size: range(random, 2, 6),
        sizeRange: range(random, 0.1, 0.45),
        strokeWidth: range(random, 0, 1.5),
      };
    case "dot-orbit":
      return {
        ...ambientTone(colors, "#101417"),
        variant,
        colorBack: colors[0],
        colors,
        size: range(random, 0.25, 0.55),
        sizeRange: range(random, 0.15, 0.5),
        speed: motion(random),
        spreading: range(random, 0.2, 0.6),
        stepsPerColor: integer(random, 1, 2),
      };
    case "warp":
      return {
        ...ambientTone(colors, "#1c1314"),
        variant,
        colors,
        distortion: range(random, 0.2, 0.5),
        proportion: range(random, 0.4, 0.6),
        shape: pick(random, ["stripes", "edge"]),
        shapeScale: range(random, 0.3, 0.6),
        softness: range(random, 0.6, 0.88),
        speed: motion(random),
        swirl: range(random, 0.15, 0.4),
        swirlIterations: integer(random, 2, 5),
      };
    case "waves":
      return {
        ...ambientTone(colors, "#0b1c1e"),
        variant,
        amplitude: range(random, 0.4, 0.8),
        colorBack: colors[0],
        colorFront: colors[2] ?? colors[1],
        frequency: range(random, 0.6, 1.3),
        proportion: range(random, 0.4, 0.6),
        shape: range(random, 1, 2.6),
        softness: range(random, 0.5, 0.85),
        spacing: range(random, 0.3, 0.8),
      };
    case "water":
      return {
        ...ambientTone(colors, "#0b1220"),
        variant,
        caustic: range(random, 0.3, 0.6),
        colorBack: colors[0],
        colorHighlight: colors[2] ?? colors[1],
        edges: range(random, 0.1, 0.35),
        highlights: range(random, 0.2, 0.5),
        layering: range(random, 0.3, 0.7),
        scale: range(random, 0.9, 1.3),
        size: range(random, 0.8, 1.6),
        speed: motion(random),
        waves: range(random, 0.3, 0.7),
      };
    case "voronoi":
      return {
        ink: colors[0],
        mist: colors[colors.length - 1] ?? colors[0],
        variant,
        colorGap: colors[0],
        colorGlow: colors[2] ?? colors[1],
        colors,
        distortion: range(random, 0.1, 0.3),
        gap: range(random, 0.008, 0.03),
        glow: range(random, 0.05, 0.2),
        speed: motion(random),
        stepsPerColor: integer(random, 1, 2),
      };
    case "swirl":
      return {
        ...ambientTone(colors, "#1a1721"),
        variant,
        bandCount: integer(random, 4, 8),
        center: range(random, 0.08, 0.3),
        colorBack: colors[0],
        colors,
        noise: range(random, 0.15, 0.4),
        noiseFrequency: range(random, 0.2, 0.55),
        proportion: range(random, 0.4, 0.6),
        softness: range(random, 0.55, 0.85),
        speed: motion(random),
        twist: range(random, 0.4, 0.8),
      };
    case "smoke-ring":
      return {
        ...ambientTone(colors, "#101b1d"),
        variant,
        colorBack: colors[0],
        colors,
        innerShape: range(random, 0.4, 1.4),
        noiseIterations: integer(random, 2, 5),
        noiseScale: range(random, 0.4, 1),
        radius: range(random, 0.35, 0.7),
        speed: motion(random),
        thickness: range(random, 0.2, 0.55),
      };
    case "static-radial-gradient":
      return {
        ...ambientTone(colors, "#171a26"),
        variant,
        colorBack: colors[0],
        colors,
        distortion: range(random, 0.15, 0.45),
        distortionFreq: range(random, 0.4, 1.2),
        distortionShift: range(random, 0, 1),
        falloff: range(random, 0.4, 0.8),
        focalAngle: integer(random, 0, 359),
        focalDistance: range(random, 0.1, 0.6),
        grainMixer: range(random, 0.02, 0.08),
        grainOverlay: range(random, 0.01, 0.04),
        mixing: range(random, 0.35, 0.7),
        radius: range(random, 0.8, 1.6),
        speed: motion(random),
      };
    case "neuro-noise":
      return {
        ...ambientTone(colors, "#101417"),
        variant,
        brightness: range(random, 0.35, 0.7),
        colorBack: colors[0],
        colorFront: colors[3] ?? colors[2],
        colorMid: colors[2] ?? colors[1],
        contrast: range(random, 0.3, 0.65),
        speed: motion(random),
      };
    case "metaballs":
      return {
        ...ambientTone(colors, "#1c1314"),
        variant,
        colorBack: colors[0],
        colors: colors.slice(1),
        count: integer(random, 6, 12),
        scale: range(random, 1, 1.5),
        size: range(random, 0.4, 0.72),
        speed: motion(random),
      };
    case "god-rays":
      return {
        ...ambientTone(colors, "#101b1d"),
        variant,
        bloom: range(random, 0.2, 0.5),
        colorBack: colors[0],
        colorBloom: colors[2] ?? colors[1],
        colors,
        density: range(random, 0.3, 0.7),
        intensity: range(random, 0.35, 0.7),
        midIntensity: range(random, 0.2, 0.5),
        midSize: range(random, 0.2, 0.5),
        speed: motion(random),
        spotty: range(random, 0.1, 0.4),
      };
    case "spiral":
      return {
        ...ambientTone(colors, "#1a1721"),
        variant,
        colorBack: colors[0],
        colorFront: colors[2] ?? colors[1],
        density: range(random, 0.3, 0.7),
        distortion: range(random, 0.15, 0.45),
        noise: range(random, 0.1, 0.35),
        noiseFrequency: range(random, 0.2, 0.6),
        softness: range(random, 0.4, 0.8),
        speed: motion(random),
        strokeCap: range(random, 0, 1),
        strokeTaper: range(random, 0, 0.6),
        strokeWidth: range(random, 0.15, 0.45),
      };
    case "dithering":
      return {
        ...ambientTone(colors, "#101417"),
        variant,
        colorBack: colors[0],
        colorFront: colors[2] ?? colors[1],
        shape: pick(random, ["simplex", "warp", "wave", "swirl", "ripple"]),
        size: range(random, 2, 5),
        speed: motion(random),
        type: pick(random, ["random", "4x4", "8x8"]),
      };
    case "pulsing-border":
      return {
        ...ambientTone(colors, "#171a26"),
        variant,
        aspectRatio: "auto",
        bloom: range(random, 0.2, 0.55),
        colorBack: colors[0],
        colors,
        intensity: range(random, 0.3, 0.65),
        margin: range(random, 0.08, 0.2),
        pulse: range(random, 0.2, 0.55),
        roundness: range(random, 0.2, 0.7),
        smoke: range(random, 0.15, 0.45),
        smokeSize: range(random, 0.2, 0.5),
        softness: range(random, 0.45, 0.8),
        speed: motion(random),
        spotSize: range(random, 0.2, 0.5),
        spots: integer(random, 2, 4),
        thickness: range(random, 0.15, 0.4),
      };
    case "color-panels":
      return {
        ...ambientTone(colors, "#101417"),
        variant,
        angle1: range(random, -0.4, 0.4),
        angle2: range(random, -0.4, 0.4),
        blur: range(random, 0.05, 0.3),
        colorBack: colors[0],
        colors,
        density: range(random, 0.6, 2),
        fadeIn: range(random, 0.1, 0.4),
        fadeOut: range(random, 0.1, 0.4),
        gradient: range(random, 0.2, 0.7),
        length: range(random, 0.6, 1.2),
        speed: motion(random),
      };
    case "static-mesh-gradient":
      return {
        ...ambientTone(colors, "#0b1220"),
        variant,
        colors,
        grainMixer: range(random, 0.02, 0.08),
        grainOverlay: range(random, 0.01, 0.04),
        mixing: range(random, 0.35, 0.7),
        positions: integer(random, 1, 12),
        speed: motion(random),
        waveX: range(random, 0.2, 0.6),
        waveXShift: range(random, 0, 1),
        waveY: range(random, 0.2, 0.6),
        waveYShift: range(random, 0, 1),
      };
    case "simplex-noise":
      return {
        ...ambientTone(colors, "#101b1d"),
        variant,
        colors,
        softness: range(random, 0.45, 0.85),
        speed: motion(random),
        stepsPerColor: integer(random, 1, 3),
      };
    case "perlin-noise":
      return {
        ...ambientTone(colors, "#101417"),
        variant,
        colorBack: colors[0],
        colorFront: colors[2] ?? colors[1],
        lacunarity: range(random, 1.4, 2.2),
        octaveCount: integer(random, 3, 6),
        persistence: range(random, 0.4, 0.75),
        proportion: range(random, 0.4, 0.6),
        softness: range(random, 0.4, 0.8),
        speed: motion(random),
      };
    default: {
      const unreachable: never = variant;
      return unreachable;
    }
  }
}

export function ArticleAmbientBackground({
  seed,
  config,
}: {
  seed?: string;
  config?: ReturnType<typeof getAmbientConfig>;
}) {
  const resolved = useMemo(() => config ?? getAmbientConfig(seed ?? "article"), [config, seed]);
  const { ink, mist, ...shader } = resolved;
  void ink;
  void mist;

  return <ShaderBackground aria-hidden="true" {...shader} />;
}
