import { Surface } from "@heroui/react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { MediumImageZoom } from "@/features/blog";

export function ImageNodeView({ node, selected }: NodeViewProps) {
  const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";

  return (
    <NodeViewWrapper className="my-8" data-drag-handle>
      <Surface
        variant="transparent"
        className={`overflow-hidden rounded-2xl transition-shadow ${selected ? "ring-accent ring-offset-background ring-2 ring-offset-2" : ""}`}
      >
        <MediumImageZoom src={src} alt={alt} unoptimized />
      </Surface>
    </NodeViewWrapper>
  );
}
