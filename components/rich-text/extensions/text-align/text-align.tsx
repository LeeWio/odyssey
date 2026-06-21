import { TextAlign as TiptapTextAlign } from "@tiptap/extension-text-align";

export const TextAlign = TiptapTextAlign.extend({}).configure({
  types: ["heading", "paragraph"],
});

export default TextAlign;
