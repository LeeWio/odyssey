import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { columnResizingPluginKey, CellSelection, TableMap } from "@tiptap/pm/tables";
import { afterEach, expect, it } from "vitest";
import { TableKit } from "./table";
import { setSelectedColumnWidths } from "./column-widths";
import { resizeColumnTarget } from "./resize";
let editor: Editor;
afterEach(() => editor?.destroy());
function open() {
  editor = new Editor({
    extensions: [StarterKit, TableKit],
    content:
      '<table><tr><td colspan="2" colwidth="120,180">Group</td><td colwidth="220">Other</td></tr><tr><td colwidth="120">A</td><td colwidth="180">B</td><td colwidth="220">C</td></tr></table>',
  });
  const map = TableMap.get(editor.state.doc.firstChild!);
  editor.view.dispatch(
    editor.state.tr.setSelection(CellSelection.create(editor.state.doc, 1 + map.map[3]))
  );
  editor.view.dispatch(
    editor.state.tr.setMeta(columnResizingPluginKey, { setHandle: 1 + map.map[0] })
  );
}
it("resets only the logical boundary track in merged vectors without changing selection", () => {
  open();
  const target = resizeColumnTarget(editor)!;
  const selected = editor.state.selection;
  expect(target.left).toBe(1);
  expect(setSelectedColumnWidths(editor, target, "reset", true)).toBe(true);
  expect(editor.state.doc.firstChild!.firstChild!.firstChild!.attrs.colwidth).toEqual([120, 0]);
  expect(editor.state.doc.firstChild!.child(1).child(1).attrs.colwidth).toBeNull();
  expect(editor.state.selection.eq(selected)).toBe(true);
  expect(editor.commands.undo()).toBe(true);
  expect(editor.state.doc.firstChild!.firstChild!.firstChild!.attrs.colwidth).toEqual([120, 180]);
});
it("filters only the unmoved native width write, not a concurrent cell format/content update", () => {
  open();
  const map = TableMap.get(editor.state.doc.firstChild!),
    pos = 1 + map.map[4];
  editor.view.dispatch(
    editor.state.tr.setMeta(columnResizingPluginKey, {
      setDragging: { startX: 0, startWidth: 190 },
    })
  );
  const before = editor.state.doc;
  const cell = before.nodeAt(pos)!;
  editor.view.dispatch(
    editor.state.tr.setNodeMarkup(pos, undefined, { ...cell.attrs, colwidth: [190] })
  );
  expect(editor.state.doc).toBe(before);
  editor.view.dispatch(editor.state.tr.setNodeAttribute(pos, "align", "center"));
  expect(editor.state.doc.nodeAt(pos)!.attrs.align).toBe("center");
  editor.view.dispatch(editor.state.tr.setNodeAttribute(pos, "colwidth", [190]));
  expect(editor.state.doc.nodeAt(pos)!.attrs.colwidth).toEqual([190]);
});
it("cancels a live native resize when its table is deleted by another transaction", () => {
  open();
  editor.view.dispatch(
    editor.state.tr.setMeta(columnResizingPluginKey, {
      setDragging: { startX: 0, startWidth: 180 },
    })
  );
  editor.view.dispatch(editor.state.tr.delete(0, editor.state.doc.firstChild!.nodeSize));
  expect(columnResizingPluginKey.getState(editor.state)!.dragging).toBeNull();
  expect(resizeColumnTarget(editor)).toBeNull();
});
it("keeps native resizing available after an initially disabled editor becomes editable", () => {
  editor = new Editor({ extensions: [StarterKit, TableKit], editable: false });
  expect(columnResizingPluginKey.getState(editor.state)).toBeDefined();
  editor.setEditable(true);
  editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true });
  const map = TableMap.get(editor.state.doc.firstChild!);
  editor.view.dispatch(
    editor.state.tr.setMeta(columnResizingPluginKey, { setHandle: 1 + map.map[0] })
  );
  expect(resizeColumnTarget(editor)?.left).toBe(0);
});
it("registers one native resize plugin and honors an explicit resizable:false option", () => {
  open();
  expect(
    editor.state.plugins.filter((plugin) => plugin.spec.key === columnResizingPluginKey)
  ).toHaveLength(1);
  editor.destroy();
  editor = new Editor({
    extensions: [StarterKit, TableKit.configure({ table: { resizable: false } })],
    editable: false,
  });
  expect(columnResizingPluginKey.getState(editor.state)).toBeUndefined();
});
