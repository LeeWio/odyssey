import { ReactNodeViewRenderer } from "@tiptap/react";
import { HighlightedCodeBlockSchema } from "./code-block-schema";
import { CodeBlockNodeView } from "./code-block-node-view";

export const HighlightedCodeBlock = HighlightedCodeBlockSchema.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView);
  },
});
