"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useCallback, useMemo } from "react";

import { takePendingImageFile } from "../pending-files";
import { ImageUploader } from "./ImageUploader";

/**
 * Placeholder node view: pick/drop an image, upload via existing file API,
 * then replace this node with a committed `image` node.
 */
export function ImageUploadView({ editor, getPos, node }: NodeViewProps) {
  const fileKey = typeof node.attrs.fileKey === "string" ? node.attrs.fileKey : null;
  const pendingFile = useMemo(() => takePendingImageFile(fileKey), [fileKey]);

  const commitImage = useCallback(
    (url: string) => {
      if (!url) return;
      const pos = getPos();
      if (typeof pos !== "number") return;

      editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .insertContentAt(pos, {
          type: "image",
          attrs: { src: url, alt: "", caption: "", alignment: "center", widthPercent: 100 },
        })
        .run();
    },
    [editor, getPos, node.nodeSize]
  );

  if (!editor.isEditable) {
    return (
      <NodeViewWrapper className="my-8" contentEditable={false}>
        <div className="border-separator text-muted flex min-h-32 items-center justify-center rounded-2xl border border-dashed px-4 text-sm">
          Image unavailable
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-8" contentEditable={false} data-drag-handle>
      <ImageUploader initialFile={pendingFile} onUpload={commitImage} />
    </NodeViewWrapper>
  );
}
