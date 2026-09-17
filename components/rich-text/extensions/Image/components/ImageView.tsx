"use client";

import { Surface } from "@heroui/react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import NextImage from "next/image";

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
        <NodeViewWrapper className="my-8" contentEditable={false}>
          <div className="border-separator text-muted flex min-h-32 items-center justify-center rounded-2xl border border-dashed px-4 text-sm">
            Image unavailable
          </div>
        </NodeViewWrapper>
      );
    }

    return null;
  }

  return (
    <NodeViewWrapper
      className={`my-8 flex w-full ${IMAGE_ALIGNMENT_CLASS_NAMES[alignment]}`}
      contentEditable={false}
      data-drag-handle
      onClick={() => {
        const pos = getPos();
        if (typeof pos === "number") {
          editor.commands.setNodeSelection(pos);
        }
      }}
    >
      <figure className="max-w-full flex-none" style={{ width: `${widthPercent}%` }}>
        <Surface variant="transparent" className="relative overflow-hidden rounded-2xl">
          <NextImage
            alt={alt}
            className="h-auto w-full object-contain"
            height={900}
            sizes="(max-width: 768px) 100vw, 960px"
            src={src}
            unoptimized
            width={1600}
          />
        </Surface>
        {caption ? (
          <figcaption className="text-muted mt-2 text-center text-sm">{caption}</figcaption>
        ) : null}
      </figure>
    </NodeViewWrapper>
  );
}
