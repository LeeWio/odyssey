import { TextStyleKit as TiptapTextStyleKit } from "@tiptap/extension-text-style";

export const LINE_HEIGHT_BLOCKS = ["paragraph", "heading"];

export const TextStyleKit = TiptapTextStyleKit.configure({
  // Preserve inline line heights in older documents and support paragraph spacing.
  lineHeight: { types: ["textStyle", ...LINE_HEIGHT_BLOCKS] },
});
