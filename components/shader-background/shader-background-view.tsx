"use client";

import { useReducedMotion } from "motion/react";

import { ShaderBackground } from "@/components/background/shader-background";
import { cn } from "@/lib/utils";

import type { ArticleShaderPreset } from "./article-shader-presets";

export function ShaderBackgroundView({
  className,
  mode,
  preset,
}: {
  className?: string;
  mode: "static" | "motion";
  preset: ArticleShaderPreset;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const play = mode === "motion" && !reducedMotion;
  const speed = "speed" in preset.config ? preset.config.speed : undefined;

  return (
    <ShaderBackground
      key={preset.id}
      aria-hidden="true"
      className={cn("h-full w-full", className)}
      {...preset.config}
      {...(speed === undefined ? {} : { speed: play ? speed : 0 })}
    />
  );
}
