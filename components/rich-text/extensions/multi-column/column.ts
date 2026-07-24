import { mergeAttributes, Node } from "@tiptap/core";

export const Column = Node.create({
  name: "column",

  group: "block",

  content: "block+",

  isolating: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "column",
        class:
          "flex-1 min-w-0 p-2 rounded-2xl  relative bg-surface-secondary transition-all duration-200",
      }),
      0,
    ];
  },
});

export default Column;
