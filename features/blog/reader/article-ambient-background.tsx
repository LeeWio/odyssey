import {
  articleCoverBackdrop,
  resolveArticleShaderPreset,
} from "@/components/shader-background/article-shader-presets";

export function ArticleAmbientBackground({
  presetId,
  slug,
}: {
  presetId?: string | null;
  slug: string;
}) {
  const preset = resolveArticleShaderPreset(presetId, slug);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ background: articleCoverBackdrop(preset) }} />
      <div className="bg-background/72 [@media(prefers-reduced-transparency:reduce)]:bg-background/92 absolute inset-0" />
      <div
        className="absolute inset-0 opacity-20 [@media(prefers-reduced-transparency:reduce)]:opacity-60"
        style={{
          background: "radial-gradient(ellipse at center, var(--background) 0%, transparent 68%)",
        }}
      />
    </div>
  );
}
