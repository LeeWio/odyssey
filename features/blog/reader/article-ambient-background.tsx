"use client";

import { useEffect, useMemo } from "react";

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

  useEffect(() => {
    // iOS 26 keeps a solid bar over the status area until the document has scrolled.
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (!ios || window.scrollY > 0) return;
    window.scrollTo({ top: 1, left: 0, behavior: "instant" });
  }, []);

  return (
    <ShaderBackground
      aria-hidden="true"
      className="h-full w-full [&_canvas]:!h-full [&_canvas]:!w-full [&_canvas]:![contain:none]"
      maxPixelCount={1280 * 720}
      minPixelRatio={1}
      {...preset.config}
      fit="cover"
    />
  );
}
