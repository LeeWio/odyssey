"use client";

import dynamic from "next/dynamic";
import {
  articleCoverBackdrop,
  resolveArticleShaderPreset,
  type ArticleShaderPreset,
} from "@/components/shader-background/article-shader-presets";
import { DeferredContent } from "@/components/layout/deferred-content";
import { RemoteMedia } from "@/components/ui/remote-media";

const ShaderBackgroundView = dynamic(() =>
  import("@/components/shader-background/shader-background-view").then(
    (module) => module.ShaderBackgroundView
  )
);

function MotionCover({ preset }: { preset: ArticleShaderPreset }) {
  return (
    <DeferredContent className="absolute inset-0" fallback={null}>
      <ShaderBackgroundView className="absolute inset-0" mode="motion" preset={preset} />
    </DeferredContent>
  );
}

export function ArticleCover({
  animated = false,
  presetId,
  src,
  seed,
}: {
  animated?: boolean;
  presetId?: string | null;
  src?: string | null;
  seed: string;
}) {
  const preset = resolveArticleShaderPreset(presetId, seed);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{ background: articleCoverBackdrop(preset) }}
    >
      {src ? (
        <RemoteMedia alt="" src={src} className="absolute inset-0 size-full object-cover" />
      ) : animated ? (
        <MotionCover preset={preset} />
      ) : null}
    </div>
  );
}
