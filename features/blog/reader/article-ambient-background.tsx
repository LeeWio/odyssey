"use client";

import { useMemo } from "react";

import { ShaderBackground } from "@/components/background/shader-background";
import { resolveArticleShaderPreset } from "@/components/shader-background/article-shader-presets";

export function ArticleAmbientBackground({
  presetId,
  slug,
}: {
  presetId?: string | null;
  slug: string;
}) {
  const preset = useMemo(() => resolveArticleShaderPreset(presetId, slug), [presetId, slug]);
  const speed = "speed" in preset.config ? preset.config.speed : undefined;

  return (
    <ShaderBackground
      aria-hidden="true"
      className="h-full w-full"
      maxPixelCount={1280 * 720}
      minPixelRatio={1}
      {...preset.config}
      {...(speed === undefined ? {} : { speed: speed * 0.4 })}
    />
  );
}
