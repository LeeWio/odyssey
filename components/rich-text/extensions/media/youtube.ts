import { Youtube as TiptapYoutube } from "@tiptap/extension-youtube";

export const Youtube = TiptapYoutube.configure({
  addPasteHandler: true,
  allowFullscreen: true,
  autoplay: false,
  controls: true,
  height: 480,
  inline: false,
  nocookie: true,
  width: 854,
});
