import { Mathematics as TiptapMathematics } from "@tiptap/extension-mathematics";

export const Mathematics = TiptapMathematics.configure({
  katexOptions: {
    strict: false,
    throwOnError: false,
    macros: {
      "\\N": "\\mathbb{N}",
      "\\R": "\\mathbb{R}",
      "\\Z": "\\mathbb{Z}",
    },
  },
});
