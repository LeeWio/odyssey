import { Audio as TiptapAudio } from "@tiptap/extension-audio";

export const AudioSchema = TiptapAudio.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fileName: { default: "" },
      fileSize: { default: 0 },
      mimeType: { default: "" },
      uploadId: { default: null, rendered: false },
    };
  },
}).configure({
  addPasteHandler: true,
  allowBase64: false,
  autoplay: false,
  controls: true,
  inline: false,
  preload: "metadata",
});
