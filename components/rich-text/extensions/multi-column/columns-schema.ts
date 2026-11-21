import { mergeAttributes, Node } from "@tiptap/core";
import {
  getColumnGridTemplate,
  normalizeColumnWidths,
  parseColumnWidths,
  serializeColumnWidths,
} from "./column-widths";

export interface ColumnsOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const ColumnsSchema = Node.create<ColumnsOptions>({
  name: "columns",

  group: "block",

  content: "column{2,3}",

  defining: true,

  isolating: true,

  selectable: false,

  addAttributes() {
    return {
      widths: {
        default: null,
        parseHTML: (element) =>
          parseColumnWidths(element.getAttribute("data-column-widths"), element.children.length),
        renderHTML: (attributes) => {
          const count = Array.isArray(attributes.widths) ? attributes.widths.length : 2;
          const widths = normalizeColumnWidths(attributes.widths, count);

          return {
            "data-column-widths": serializeColumnWidths(widths),
            style: `--column-widths: ${getColumnGridTemplate(widths)}`,
          };
        },
      },
    };
  },

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="columns"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const widths = normalizeColumnWidths(node.attrs.widths, node.childCount);

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "columns",
        "data-column-widths": serializeColumnWidths(widths),
        class: "my-4 grid w-full gap-4 [grid-template-columns:var(--column-widths)]",
        style: `--column-widths: ${getColumnGridTemplate(widths)}`,
      }),
      0,
    ];
  },
});
