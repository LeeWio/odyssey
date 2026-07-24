import { mergeAttributes } from "@tiptap/core";
import { HorizontalRule as TiptapHorizontalRule } from "@tiptap/extension-horizontal-rule";

export const HorizontalRule = TiptapHorizontalRule.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "hr",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "separator",
      }),
    ];
  },
});

export default HorizontalRule;
