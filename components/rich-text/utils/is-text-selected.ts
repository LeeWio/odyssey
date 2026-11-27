import { type Editor, isTextSelection } from "@tiptap/react";

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

  return isTextSelection(selection) && !empty && !!doc.textBetween(from, to) && editor.isEditable;
};
