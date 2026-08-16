import { createAtomBlockMarkdownSpec, mergeAttributes, Node, parseAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { MediaNodeView } from "./media-node-view";

export const Attachment = Node.create({
  name: "attachment",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      src: { default: null },
      fileName: { default: "" },
      fileSize: { default: 0 },
      mimeType: { default: "" },
      uploadId: { default: null, rendered: false },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-attachment][href]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-attachment": "",
        download: HTMLAttributes.fileName || true,
        href: HTMLAttributes.src,
        rel: "noopener noreferrer",
      }),
      HTMLAttributes.fileName || "Download attachment",
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MediaNodeView);
  },
  ...createAtomBlockMarkdownSpec({
    nodeName: "attachment",
    requiredAttributes: ["src"],
    allowedAttributes: ["src", "fileName", "fileSize", "mimeType"],
    parseAttributes: (source) => {
      const attributes = parseAttributes(source);
      return {
        ...attributes,
        ...(attributes.fileSize !== undefined
          ? { fileSize: Number(attributes.fileSize) || 0 }
          : {}),
      };
    },
  }),
});
