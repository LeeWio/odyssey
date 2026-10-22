import { mergeAttributes, Node } from "@tiptap/core";

export interface ColumnOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const Column = Node.create<ColumnOptions>({
  name: "column",

  content: "block+",

  defining: true,

  isolating: true,

  selectable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

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
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "column",
        class: "relative min-w-0 rounded-2xl bg-surface-secondary p-2",
      }),
      0,
    ];
  },
});

export default Column;
