import { Editor } from "@tiptap/core";
import { CharacterCount } from "@tiptap/extensions";

import { createConversionExtensions } from "@/components/rich-text/extensions/extension-kit";
import {
  normalizeRichTextDocument,
  parseJSONContent,
} from "@/components/rich-text/utils/document-normalizer";

/**
 * Adult silent-reading rates from Brysbaert (2019): about 238 English words
 * per minute, and about 260 Chinese characters per minute.
 */
const LATIN_WORDS_PER_MINUTE = 238;
const CJK_CHARACTERS_PER_MINUTE = 260;

/**
 * The same document schema the reader renders, plus CharacterCount.
 * `element: null` keeps the editor headless, so counting never mounts a view.
 */
const extensions = [
  ...createConversionExtensions(),
  CharacterCount.configure({
    wordCounter: (text) => text.split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word)).length,
  }),
];

function openDocument(content: string | null | undefined, contentType?: string | null) {
  if (!content || contentType !== "JSON") return null;
  const parsed = parseJSONContent(content);
  if (!parsed) return null;

  try {
    return new Editor({
      element: null,
      extensions,
      content: normalizeRichTextDocument(parsed),
      editable: false,
      injectCSS: false,
    });
  } catch {
    return null;
  }
}

function cjkCharacters(text: string) {
  return (
    text.match(/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/gu)
      ?.length ?? 0
  );
}

/** Minutes for the visible Tiptap document, using the editor's own counters. */
export function readingMinutes(content: string | null | undefined, contentType?: string | null) {
  const editor = openDocument(content, contentType);
  if (!editor) return 1;

  try {
    const text = editor.getText({ blockSeparator: "\n" }).trim();
    if (!text) return 1;

    const cjk = cjkCharacters(text);
    const latinWords = editor.storage.characterCount.words();
    return Math.max(
      1,
      Math.ceil(cjk / CJK_CHARACTERS_PER_MINUTE + latinWords / LATIN_WORDS_PER_MINUTE)
    );
  } finally {
    editor.destroy();
  }
}
