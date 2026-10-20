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
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/*
        Blur the shader, not the type. backdrop-filter does not reliably sample
        a WebGL canvas, so the gaussian lives on an oversized shader layer and
        the article stays a sharp layer above it. The outset hides the blur's
        transparent edge; saturation puts back the chroma blur removes.
      */}
      <div className="absolute inset-[-18%] [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:scale-125 [&_canvas]:[filter:blur(64px)_saturate(1.5)]">
        <ShaderBackground
          className="h-full w-full"
          maxPixelCount={1280 * 720}
          minPixelRatio={1}
          {...preset.config}
          {...(speed === undefined ? {} : { speed: speed * 0.4 })}
        />
      </div>
      <div className="bg-background/72 [@media(prefers-reduced-transparency:reduce)]:bg-background/92 absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--background)_0%,transparent_68%)] opacity-20 [@media(prefers-reduced-transparency:reduce)]:opacity-60" />
    </div>
  );
}
