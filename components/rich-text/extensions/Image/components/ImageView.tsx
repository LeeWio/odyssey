"use client";

import { Surface, Typography } from "@heroui/react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import type { MouseEvent } from "react";

import { MediumImageZoom } from "@/features/blog/reader/medium-image-zoom";

import {
  IMAGE_ALIGNMENT_CLASS_NAMES,
  normalizeImageAlignment,
  normalizeImageWidthPercent,
} from "../attributes";

/**
 * Display node for a committed image (has `src`).
 * Upload UX lives in the separate `imageUpload` placeholder node.
 */
export function ImageView({ editor, getPos, node }: NodeViewProps) {
  const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
  const caption = typeof node.attrs.caption === "string" ? node.attrs.caption : "";
  const widthPercent = normalizeImageWidthPercent(node.attrs.widthPercent);
  const alignment = normalizeImageAlignment(node.attrs.alignment);

  if (!src) {
    if (!editor.isEditable) {
      return (
        <NodeViewWrapper contentEditable={false}>
          <Surface
            variant="secondary"
            className="flex min-h-32 items-center justify-center rounded-2xl px-4"
          >
            <Typography color="muted" type="body-sm">
              Image unavailable
            </Typography>
          </Surface>
        </NodeViewWrapper>
      );
    }

    return null;
  }

  const selectImageNode = () => {
    const pos = getPos();
    if (typeof pos === "number") {
      editor.chain().focus().setNodeSelection(pos).run();
    }
  };

  return (
    <NodeViewWrapper
      className={`flex w-full ${IMAGE_ALIGNMENT_CLASS_NAMES[alignment]}`}
      contentEditable={false}
      data-drag-handle
      onMouseDown={(event: MouseEvent) => {
        if (event.button === 0) {
          event.preventDefault();
          selectImageNode();
        }
      }}
      onClick={selectImageNode}
    >
      <figure className="max-w-full flex-none" style={{ width: `${widthPercent}%` }}>
        <Surface variant="transparent" className="relative overflow-hidden rounded-2xl">
          <MediumImageZoom alt={alt} className="w-full" enableZoom={false} src={src} unoptimized />
        </Surface>
        {caption ? (
          <figcaption className="mt-2 text-center">
            <Typography color="muted" type="body-sm">
              {caption}
            </Typography>
          </figcaption>
        ) : null}
      </figure>
    </NodeViewWrapper>
  );
}
