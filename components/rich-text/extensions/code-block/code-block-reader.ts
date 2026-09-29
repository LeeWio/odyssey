import CodeBlock from "@tiptap/extension-code-block";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { CodeBlockReaderView } from "./code-block-reader-view";

export const ReaderCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockReaderView, {
      contentDOMElementTag: "code",
    });
  },
});
