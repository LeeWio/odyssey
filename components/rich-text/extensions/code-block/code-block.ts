import { CodeBlockLowlight as TiptapCodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeBlockNodeView } from "./code-block-node-view";
import { createLowlight, common } from "lowlight";

const lowlight = createLowlight(common);

export const CodeBlockLowlight = TiptapCodeBlockLowlight.extend({
  // Set priority higher than the default CodeBlock (which has default priority 100)
  // to ensure Tiptap resolves the 'codeBlock' schema, input rules, and keymaps
  // to our custom CodeBlockLowlight node instead of the default StarterKit CodeBlock.
  priority: 1000,

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView);
  },
}).configure({
  lowlight,
});
