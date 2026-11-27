import type { Editor } from "@tiptap/react";
import { HIGHLIGHTED_CODE_BLOCK } from "../code-block/code-block-schema";

export const isTableGripSelected = (node: HTMLElement | null) => {
  let container: HTMLElement | null = node;

  while (container && !["TD", "TH"].includes(container.tagName)) {
    container = container.parentElement;
  }

  const gripColumn = container?.querySelector?.("a.grip-column.selected");
  const gripRow = container?.querySelector?.("a.grip-row.selected");

  return !!(gripColumn || gripRow);
};

export const isCustomNodeSelected = (editor: Editor, node: HTMLElement | null) => {
  const customNodes = [
    "image",
    "imageUpload",
    "audio",
    "attachment",
    "youtube",
    "inlineMath",
    "blockMath",
    HIGHLIGHTED_CODE_BLOCK,
    "link",
    "horizontalRule",
    "columns",
    "column",
    "details",
    "detailsSummary",
    "detailsContent",
  ];

  const isActive = customNodes.some((type) => editor.isActive(type));

  return isActive || isTableGripSelected(node);
};
