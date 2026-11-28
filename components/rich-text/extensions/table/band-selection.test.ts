import { Editor } from "@tiptap/core";
import { CellSelection, selectedRect, TableMap } from "@tiptap/pm/tables";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, expect, it } from "vitest";
import { tableBandSelection } from "./actions";
import { TableKit } from "./table";

let editor: Editor;
afterEach(() => editor?.destroy());
function open() {
  editor = new Editor({
    extensions: [StarterKit, TableKit],
    content: {
      type: "doc",
      content: [
        {
          type: "table",
          content: Array.from({ length: 4 }, (_, row) => ({
            type: "tableRow",
            content: Array.from({ length: 3 }, (_, col) => ({
              type: "tableCell",
              content: [{ type: "paragraph", content: [{ type: "text", text: `${row}:${col}` }] }],
            })),
          })),
        },
      ],
    },
  });
}
function cell(row: number, col = 0) {
  const map = TableMap.get(editor.state.doc.firstChild!);
  return editor.state.doc.resolve(1 + map.map[row * map.width + col]);
}
function use(selection: CellSelection) {
  editor.view.dispatch(editor.state.tr.setSelection(selection));
  return selectedRect(editor.state);
}

it("expands a partial cell range to both complete rows, and ignores an unrelated hovered row", () => {
  open();
  const active = new CellSelection(cell(1, 0), cell(2, 1));
  expect(use(tableBandSelection(cell(2, 1), "row", 2, active))).toMatchObject({
    top: 1,
    bottom: 3,
    left: 0,
    right: 3,
  });
  expect(use(tableBandSelection(cell(3, 1), "row", 3, active))).toMatchObject({
    top: 3,
    bottom: 4,
  });
});
it("extends and shrinks with Shift while retaining the original anchor in either direction", () => {
  open();
  let active = tableBandSelection(cell(2), "row", 2);
  active = tableBandSelection(cell(0), "row", 0, active, true);
  expect(use(active)).toMatchObject({ top: 0, bottom: 3 });
  active = tableBandSelection(cell(1), "row", 1, active, true);
  expect(use(active)).toMatchObject({ top: 1, bottom: 3 });
  active = tableBandSelection(cell(3), "row", 3, active, true);
  expect(use(active)).toMatchObject({ top: 2, bottom: 4 });
});
it("expands a rectangular range to complete columns", () => {
  open();
  const active = new CellSelection(cell(1, 0), cell(2, 1));
  expect(use(tableBandSelection(cell(2, 1), "column", 1, active))).toMatchObject({
    top: 0,
    bottom: 4,
    left: 0,
    right: 2,
  });
});
it("does not reuse selection coordinates from a different table", () => {
  open();
  const source = editor.state.doc.firstChild!.toJSON();
  editor.commands.setContent({ type: "doc", content: [source, { type: "paragraph" }, source] });
  const active = new CellSelection(cell(1, 0), cell(2, 1));
  const second = editor.state.doc.firstChild!.nodeSize + 2;
  const map = TableMap.get(editor.state.doc.nodeAt(second)!);
  const target = editor.state.doc.resolve(second + 1 + map.map[map.width]);
  expect(use(tableBandSelection(target, "row", 1, active))).toMatchObject({ top: 1, bottom: 2 });
});

it("switches from a selected column to just the hovered row, and vice versa", () => {
  open();
  const column = tableBandSelection(cell(1, 1), "column", 1);
  expect(use(tableBandSelection(cell(2, 1), "row", 2, column))).toMatchObject({
    top: 2,
    bottom: 3,
  });
  const row = tableBandSelection(cell(1, 1), "row", 1);
  expect(use(tableBandSelection(cell(1, 2), "column", 2, row))).toMatchObject({
    left: 2,
    right: 3,
  });
});
