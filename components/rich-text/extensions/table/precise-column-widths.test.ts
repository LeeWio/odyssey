import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { CellSelection, selectedRect, TableMap } from "@tiptap/pm/tables";
import { afterEach, expect, it } from "vitest";
import { TableKit } from "./table";
import { setSelectedColumnWidths, selectedColumnWidth } from "./column-widths";
import { applyTableAction } from "./actions";

let editor: Editor;
afterEach(() => editor?.destroy());
function open(minimum = 100) {
  editor = new Editor({
    extensions: [
      StarterKit.configure({ trailingNode: false }),
      TableKit.configure({ table: { cellMinWidth: minimum } }),
    ],
    content:
      '<table><tr><td colspan="2" colwidth="120,180">Group</td><td colwidth="220">Other</td></tr><tr><td colwidth="120">A</td><td colwidth="180">B</td><td colwidth="220">C</td></tr></table>',
  });
  const map = TableMap.get(editor.state.doc.firstChild!);
  editor.view.dispatch(
    editor.state.tr.setSelection(
      CellSelection.create(editor.state.doc, 1 + map.map[0], 1 + map.map[4])
    )
  );
}
it("applies one width to a merged multi-column range, preserving content/neighbors and exact undo/redo", () => {
  open();
  const before = editor.getJSON(),
    selection = editor.state.selection;
  expect(selectedColumnWidth(editor, selectedRect(editor.state))).toEqual({
    minimum: 100,
    count: 2,
    value: undefined,
  });
  expect(applyTableAction(editor, "column", { width: 160 }, false)).toBe(true);
  expect(editor.getJSON()).toEqual(before);
  expect(applyTableAction(editor, "column", { width: 160 })).toBe(true);
  const after = editor.getJSON();
  const table = editor.state.doc.firstChild!;
  expect(table.firstChild!.firstChild!.attrs.colwidth).toEqual([160, 160]);
  expect(table.child(1).children.map((cell) => cell.attrs.colwidth)).toEqual([[160], [160], [220]]);
  expect(table.textContent).toBe("GroupOtherABC");
  expect(editor.state.selection.eq(selection)).toBe(true);
  expect(selectedColumnWidth(editor, selectedRect(editor.state)).value).toBe(160);
  expect(applyTableAction(editor, "column", { width: 160 })).toBe(false);
  expect(editor.commands.undo()).toBe(true);
  expect(editor.getJSON()).toEqual(before);
  expect(editor.commands.redo()).toBe(true);
  expect(editor.getJSON()).toEqual(after);
});
it("updates only one logical slot of a spanning vector", () => {
  open();
  const rect = { ...selectedRect(editor.state), left: 1, right: 2 };
  expect(setSelectedColumnWidths(editor, rect, 190, true)).toBe(true);
  expect(editor.state.doc.firstChild!.firstChild!.firstChild!.attrs.colwidth).toEqual([120, 190]);
  expect(editor.state.doc.firstChild!.child(1).children.map((cell) => cell.attrs.colwidth)).toEqual(
    [[120], [190], [220]]
  );
});
it("rejects invalid integers, respects the configured minimum and read-only/capability/no-op guards", () => {
  open(60);
  const before = editor.state.doc;
  for (const width of [NaN, Infinity, -1, 0, 59, 60.5, Number.MAX_SAFE_INTEGER + 1]) {
    expect(applyTableAction(editor, "column", { width })).toBe(false);
    expect(editor.state.doc).toBe(before);
  }
  expect(applyTableAction(editor, "row", { width: 90 })).toBe(false);
  expect(applyTableAction(editor, "column", { width: 60 }, false)).toBe(true);
  expect(editor.state.doc).toBe(before);
  expect(applyTableAction(editor, "column", { width: 60 })).toBe(true);
  const rect = selectedRect(editor.state);
  editor.setEditable(false);
  expect(setSelectedColumnWidths(editor, rect, 90, true)).toBe(false);
  expect(applyTableAction(editor, "column", { width: 90 })).toBe(false);
});
it("rejects a stale target after the table changes", () => {
  open();
  const rect = selectedRect(editor.state);
  expect(applyTableAction(editor, "column", { width: 170 })).toBe(true);
  const after = editor.state.doc;
  expect(setSelectedColumnWidths(editor, rect, 200, true)).toBe(false);
  expect(editor.state.doc).toBe(after);
});
