import { Image as TiptapImage } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { normalizeImageAlignment, normalizeImageWidthPercent } from "./image-attributes";
import { ImageNodeView } from "./image-node-view";

export const Image = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: "center",
        parseHTML: (element) => normalizeImageAlignment(element.getAttribute("data-alignment")),
        renderHTML: (attributes) => ({
          "data-alignment": normalizeImageAlignment(attributes.alignment),
        }),
      },
      widthPercent: {
        default: 100,
        parseHTML: (element) =>
          normalizeImageWidthPercent(element.getAttribute("data-width-percent")),
        renderHTML: (attributes) => ({
          "data-width-percent": normalizeImageWidthPercent(attributes.widthPercent),
        }),
      },
      uploadId: {
        default: null,
        rendered: false,
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
}).configure({
  allowBase64: false,
  inline: false,
});
