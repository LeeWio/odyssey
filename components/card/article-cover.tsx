"use client";

import { useReducedMotion } from "motion/react";
import { useMemo } from "react";

import {
  ShaderBackground,
  type ShaderBackgroundProps,
} from "@/components/background/shader-background";

const PALETTES = [
  ["#172554", "#4f46e5", "#a78bfa"],
  ["#052e16", "#15803d", "#86efac"],
  ["#431407", "#c2410c", "#fdba74"],
  ["#164e63", "#0891b2", "#67e8f9"],
] as const;

const SHAPES = ["checks", "stripes", "edge"] as const;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function seedHash(value: string) {
  return Array.from(value).reduce(
    (hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619),
    2166136261
  );
}

export function articleCoverConfig(
  seed: string
): Extract<ShaderBackgroundProps, { variant: "warp" }> {
  const random = seededRandom(seedHash(seed));
  const between = (min: number, max: number) => min + random() * (max - min);
  const palette = PALETTES[Math.floor(random() * PALETTES.length)];

  return {
    variant: "warp",
    colors: [...palette],
    proportion: between(0.3, 0.7),
    softness: between(0.35, 0.8),
    distortion: between(0.2, 0.55),
    swirl: between(0.35, 0.7),
    swirlIterations: Math.floor(between(5, 10)),
    shape: SHAPES[Math.floor(random() * SHAPES.length)],
    shapeScale: between(0.18, 0.5),
    scale: between(0.8, 1.3),
    rotation: Math.floor(random() * 360),
    speed: between(0.25, 0.65),
  };
}

export function ArticleCover({ seed, animated = true }: { seed: string; animated?: boolean }) {
  const reduceMotion = useReducedMotion() ?? false;
  const config = useMemo(() => articleCoverConfig(seed), [seed]);

  return (
    <ShaderBackground
      aria-hidden="true"
      className="absolute inset-0"
      {...config}
      speed={animated && !reduceMotion ? config.speed : 0}
    />
  );
}
