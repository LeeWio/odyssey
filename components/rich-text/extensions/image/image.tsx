import { Image as TiptapImage } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { normalizeImageAlignment, normalizeImageWidthPercent } from "./image-attributes";
import { ImageNodeView } from "./image-node-view";

function escapeHTMLAttribute(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

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
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") ?? "",
        renderHTML: (attributes) =>
          attributes.caption ? { "data-caption": String(attributes.caption) } : {},
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  renderMarkdown(node) {
    const src = String(node.attrs?.src ?? "");
    const alt = String(node.attrs?.alt ?? "");
    const title = String(node.attrs?.title ?? "");
    const caption = String(node.attrs?.caption ?? "");
    const alignment = normalizeImageAlignment(node.attrs?.alignment);
    const widthPercent = normalizeImageWidthPercent(node.attrs?.widthPercent);
    const needsExtendedHTML = Boolean(caption) || alignment !== "center" || widthPercent !== 100;

    if (!needsExtendedHTML) {
      return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
    }

    const attributes = [
      `src="${escapeHTMLAttribute(src)}"`,
      `alt="${escapeHTMLAttribute(alt)}"`,
      title ? `title="${escapeHTMLAttribute(title)}"` : "",
      caption ? `data-caption="${escapeHTMLAttribute(caption)}"` : "",
      `data-alignment="${escapeHTMLAttribute(alignment)}"`,
      `data-width-percent="${widthPercent}"`,
    ].filter(Boolean);

    return `<img ${attributes.join(" ")}>`;
  },
}).configure({
  allowBase64: false,
  inline: false,
});
