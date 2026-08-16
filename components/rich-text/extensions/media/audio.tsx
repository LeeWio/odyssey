import { Audio as TiptapAudio } from "@tiptap/extension-audio";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { MediaNodeView } from "./media-node-view";

export const Audio = TiptapAudio.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fileName: { default: "" },
      fileSize: { default: 0 },
      mimeType: { default: "" },
      uploadId: { default: null, rendered: false },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(MediaNodeView);
  },
}).configure({
  addPasteHandler: true,
  allowBase64: false,
  autoplay: false,
  controls: true,
  inline: false,
  preload: "metadata",
});
