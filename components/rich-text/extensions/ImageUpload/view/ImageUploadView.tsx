"use client";

import { Surface, Typography } from "@heroui/react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useCallback, useMemo } from "react";

import { takePendingImageFile } from "../pending-files";
import { ImageUploader } from "./ImageUploader";

/**
 * Placeholder node view: HeroUI DropZone → existing file API → committed `image` node.
 */
export function ImageUploadView({ editor, getPos, node, deleteNode }: NodeViewProps) {
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

  return (
    <NodeViewWrapper className="my-8" contentEditable={false} data-drag-handle>
      <ImageUploader
        initialFile={pendingFile}
        onCancel={() => deleteNode()}
        onUpload={commitImage}
      />
    </NodeViewWrapper>
  );
}
