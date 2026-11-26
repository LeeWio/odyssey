import { Mathematics as TiptapMathematics } from "@tiptap/extension-mathematics";

import "katex/dist/katex.min.css";

export const mathematicsKatexOptions = {
  strict: false,
  throwOnError: false,
  macros: {
    "\\N": "\\mathbb{N}",
    "\\R": "\\mathbb{R}",
    "\\Z": "\\mathbb{Z}",
  },
};

export const Mathematics = TiptapMathematics.configure({
  katexOptions: mathematicsKatexOptions,
});
