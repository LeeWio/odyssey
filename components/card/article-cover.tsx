"use client";

import { useMemo } from "react";

import { resolveArticleShaderPreset } from "@/components/shader-background/article-shader-presets";
import { ShaderBackgroundView } from "@/components/shader-background/shader-background-view";

export function ArticleCover({
  animated = false,
  presetId,
  scheduled = true,
  seed,
}: {
  animated?: boolean;
  presetId?: string | null;
  scheduled?: boolean;
  seed: string;
}) {
  const preset = useMemo(() => resolveArticleShaderPreset(presetId, seed), [presetId, seed]);

  return (
    <ShaderBackgroundView
      className="absolute inset-0"
      mode={animated ? "motion" : "static"}
      preset={preset}
      scheduled={scheduled}
    />
  );
}
