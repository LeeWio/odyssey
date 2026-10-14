"use client";

import { useMemo } from "react";

import {
  ShaderBackground,
  type ShaderBackgroundProps,
} from "@/components/background/shader-background";

type ArticleShaderPreset =
  | "mesh"
  | "grain"
  | "grain-sunset"
  | "grain-pastel"
  | "mesh-aurora"
  | "mesh-citrus"
  | "warp"
  | "voronoi";

const PRESETS: ArticleShaderPreset[] = [
  "mesh",
  "grain",
  "grain-sunset",
  "grain-pastel",
  "mesh-aurora",
  "mesh-citrus",
  "warp",
  "voronoi",
];

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

function getAmbientConfig(seed: string): ShaderBackgroundProps {
  const random = seededRandom(hashSeed(seed));
  const preset = pick(random, PRESETS);

  switch (preset) {
    case "grain":
      return {
        variant: "grain-gradient",
        colors: [...pick(random, [PALETTES.blue, PALETTES.teal, PALETTES.graphite])],
        intensity: range(random, 0.08, 0.18),
        noise: range(random, 0.06, 0.14),
        shape: pick(random, ["wave", "blob", "ripple"]),
        softness: range(random, 0.62, 0.82),
        speed: range(random, 0.06, 0.12),
      };
    case "grain-sunset":
      return {
        variant: "grain-gradient",
        colors: [...PALETTES.sunset],
        intensity: range(random, 0.1, 0.2),
        noise: range(random, 0.07, 0.15),
        shape: pick(random, ["wave", "blob", "sphere"]),
        softness: range(random, 0.58, 0.78),
        speed: range(random, 0.055, 0.105),
      };
    case "grain-pastel":
      return {
        variant: "grain-gradient",
        colors: [...PALETTES.pastel],
        intensity: range(random, 0.06, 0.14),
        noise: range(random, 0.05, 0.12),
        shape: pick(random, ["dots", "truchet", "blob"]),
        softness: range(random, 0.72, 0.92),
        speed: range(random, 0.045, 0.09),
      };
    case "mesh-aurora":
      return {
        variant: "mesh-gradient",
        colors: [...PALETTES.aurora],
        distortion: range(random, 0.24, 0.42),
        grainMixer: range(random, 0.025, 0.07),
        grainOverlay: range(random, 0.01, 0.04),
        rotation: integer(random, 0, 359),
        speed: range(random, 0.07, 0.14),
        swirl: range(random, 0.12, 0.28),
      };
    case "mesh-citrus":
      return {
        variant: "mesh-gradient",
        colors: [...PALETTES.citrus],
        distortion: range(random, 0.2, 0.36),
        grainMixer: range(random, 0.02, 0.06),
        grainOverlay: range(random, 0.01, 0.035),
        rotation: integer(random, 0, 359),
        speed: range(random, 0.08, 0.16),
        swirl: range(random, 0.1, 0.24),
      };
    case "warp":
      return {
        variant: "warp",
        colors: [...pick(random, [PALETTES.sunset, PALETTES.violet, PALETTES.teal])],
        distortion: range(random, 0.12, 0.26),
        proportion: range(random, 0.42, 0.58),
        shape: pick(random, ["stripes", "edge", "checks"]),
        shapeScale: range(random, 0.3, 0.62),
        softness: range(random, 0.68, 0.88),
        swirl: range(random, 0.08, 0.2),
        swirlIterations: integer(random, 2, 5),
        speed: range(random, 0.05, 0.11),
      };
    case "voronoi":
      return {
        variant: "voronoi",
        colorGap: pick(random, ["#11181a", "#151b1d", "#201a17"]),
        colorGlow: pick(random, ["#6d827f", "#806d78", "#8b735e"]),
        colors: [...pick(random, [PALETTES.blue, PALETTES.aurora, PALETTES.sunset])],
        distortion: range(random, 0.08, 0.2),
        gap: range(random, 0.008, 0.022),
        glow: range(random, 0.04, 0.12),
        scale: range(random, 0.76, 1.08),
        speed: range(random, 0.045, 0.095),
        stepsPerColor: integer(random, 1, 2),
      };
    case "mesh":
    default:
      return {
        variant: "mesh-gradient",
        colors: [...pick(random, [PALETTES.blue, PALETTES.teal, PALETTES.graphite])],
        distortion: range(random, 0.22, 0.44),
        grainMixer: range(random, 0.025, 0.075),
        grainOverlay: range(random, 0.01, 0.04),
        rotation: integer(random, 0, 359),
        speed: range(random, 0.08, 0.16),
        swirl: range(random, 0.12, 0.28),
      };
  }
}

export function ArticleAmbientBackground({ seed }: { seed: string }) {
  const config = useMemo(() => getAmbientConfig(seed), [seed]);

  return <ShaderBackground aria-hidden="true" {...config} />;
}
