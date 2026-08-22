import { CodeBlockLowlight as TiptapCodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeBlockNodeView } from "./code-block-node-view";
import { createLowlight, common } from "lowlight";

const lowlight = createLowlight(common);

export const CodeBlockLowlight = TiptapCodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView);
  },
}).configure({
  lowlight,
});
