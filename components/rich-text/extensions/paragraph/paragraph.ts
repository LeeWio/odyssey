import { Paragraph as TiptapParagraph } from "@tiptap/extension-paragraph";
import { mergeAttributes } from "@tiptap/core";

export const Paragraph = TiptapParagraph.extend({
  // 只重写 renderHTML，其他行为（parseHTML、commands 等）全部继承
  renderHTML({ HTMLAttributes }) {
    return [
      "p",
      mergeAttributes(
        this.options.HTMLAttributes, // 全局配置的属性
        HTMLAttributes, // 节点动态属性
        {
          class: "typography--body", // 👈 使用你的 typography 类
        }
      ),
      0,
    ];
  },
});

export default Paragraph;
