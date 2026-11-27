import { getStyleProperty } from "@tiptap/core";
import { LineHeight, TextStyleKit as TiptapTextStyleKit } from "@tiptap/extension-text-style";

export const LINE_HEIGHT_BLOCKS = ["paragraph", "heading"];

const DocumentLineHeight = LineHeight.extend({
  addGlobalAttributes() {
    return (this.parent?.() ?? []).map((group) => ({
      ...group,
      attributes: {
        ...group.attributes,
        lineHeight: {
          ...group.attributes.lineHeight,
          // An unstyled paragraph after a table must round-trip to the schema default.
          parseHTML: (element: HTMLElement) =>
            getStyleProperty(element, "line-height") || element.style.lineHeight || null,
        },
      },
    }));
  },
});

export const TextStyleKit = TiptapTextStyleKit.extend({
  addExtensions() {
    return [
      ...(this.parent?.() ?? []),
      DocumentLineHeight.configure({ types: ["textStyle", ...LINE_HEIGHT_BLOCKS] }),
    ];
  },
}).configure({ lineHeight: false });
