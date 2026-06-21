import { isTextSelection, Editor } from "@tiptap/react";

/**
 * Checks if there is a text selection in the editor.
 *
 * It handles edge cases where `empty` might not be enough,
 * such as double-clicking an empty paragraph.
 */
export const isTextSelected = ({ editor }: { editor: Editor }) => {
  const {
    state: {
      doc,
      selection,
      selection: { empty, from, to },
    },
  } = editor;

  // Sometimes check for `empty` is not enough.
  // Double-clicking an empty paragraph returns a node size of 2.
  // So we also check for an empty text size.
  const isEmptyTextBlock = !doc.textBetween(from, to).length && isTextSelection(selection);

  return !empty && !isEmptyTextBlock && editor.isEditable;
};
