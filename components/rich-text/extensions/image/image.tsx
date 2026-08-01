import { Node, mergeAttributes, ReactNodeViewRenderer } from "@tiptap/react";
import { MediumImageZoom } from "@/features/blog";

export const Image = Node.create({
  name: "image",
  group: "block",
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node }) => {
      const { src, alt } = node.attrs;
      return (
        <div className="my-8">
          <MediumImageZoom src={src} alt={alt || ""} />
        </div>
      );
    });
  },
});
