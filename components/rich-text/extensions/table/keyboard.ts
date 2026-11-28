import type { Editor } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import { TextSelection } from "@tiptap/pm/state";
import { CellSelection, cellAround } from "@tiptap/pm/tables";

export function leaveCellSelection(editor: Editor) {
  const { selection, tr } = editor.state;
  if (!editor.isEditable || !(selection instanceof CellSelection)) return false;
  editor.view.dispatch(
    tr.setSelection(TextSelection.near(selection.$headCell, 1)).scrollIntoView()
  );
  return true;
}

/** Exit the containing table without accumulating blank paragraphs on repeated visits. */
export function exitTable(editor: Editor, before = false) {
  if (!editor.isEditable) return false;
  const { state } = editor;
  if (!(state.selection instanceof CellSelection) && state.selection.$head.parent.type.spec.code)
    return false;
  const $cell =
    state.selection instanceof CellSelection
      ? state.selection.$headCell
      : cellAround(state.selection.$head);
  if (!$cell) return false;
  const from = $cell.before(-1),
    to = $cell.after(-1);
  const position = before ? from : to;
  const $boundary = state.doc.resolve(position);
  const adjacent = before ? $boundary.nodeBefore : $boundary.nodeAfter;
  if (adjacent?.type === state.schema.nodes.paragraph) {
    editor.view.dispatch(
      state.tr.setSelection(TextSelection.near($boundary, before ? -1 : 1)).scrollIntoView()
    );
    return true;
  }
  const paragraph = state.schema.nodes.paragraph.createAndFill();
  const index = $boundary.index();
  if (!paragraph || !$boundary.parent.canReplaceWith(index, index, paragraph.type)) return false;
  const tr = state.tr.insert(position, paragraph);
  tr.setSelection(TextSelection.near(tr.doc.resolve(position + 1), 1));
  editor.view.dispatch(closeHistory(tr).scrollIntoView());
  return true;
}
