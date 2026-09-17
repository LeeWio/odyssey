import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { ImageUploadView } from "./view/ImageUploadView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageUpload: {
      setImageUpload: () => ReturnType;
      setImageUploadAt: (attributes: { pos: number; fileKey?: string }) => ReturnType;
    };
  }
}

/**
 * Placeholder block for picking/uploading an image (template ImageUpload pattern).
 * After upload completes, the view replaces this node with a committed `image`.
 */
export const ImageUpload = Node.create({
  name: "imageUpload",

  group: "block",
  isolating: true,
  defining: true,
  draggable: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      fileKey: {
        default: null,
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": this.name })];
  },

  addCommands() {
    return {
      setImageUpload:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
      setImageUploadAt:
        ({ pos, fileKey }) =>
        ({ commands }) =>
          commands.insertContentAt(pos, {
            type: this.name,
            attrs: fileKey ? { fileKey } : {},
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploadView);
  },
});

export default ImageUpload;
