import type { Editor } from "@tiptap/react";
import { HIGHLIGHTED_CODE_BLOCK } from "../code-block/code-block-schema";

export const isCustomNodeSelected = (editor: Editor) => {
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

  return customNodes.some((type) => editor.isActive(type));
};
