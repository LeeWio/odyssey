import { getSchema } from "@tiptap/core";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { CellSelection } from "@tiptap/pm/tables";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import { TableKit } from "../../extensions/table/table";
import { mapMenuTarget, type MenuTarget } from "./table-target";

const schema = getSchema([StarterKit, TableKit]);
const paragraph = schema.nodes.paragraph.create();
const cell = schema.nodes.tableCell.create(null, paragraph);
const row = schema.nodes.tableRow.create(null, [cell, cell]);
const table = schema.nodes.table.create(null, [row, row]);
const doc = schema.nodes.doc.create(null, [table, table, paragraph]);
const selection = CellSelection.create(doc, 2);
const state = EditorState.create({ doc, selection });
const target: MenuTarget = {
  kind: "column",
  selected: selection,
  anchor: { cell: 2, index: 0, offset: 0 },
};

describe("table menu target", () => {
  it("tracks the selected cell through outer edits and a plugin's appended column insertion", () => {
    const beforeTable = state.tr.insert(0, paragraph);
    const after = state.apply(beforeTable);
    const beforeColumn = after.tr;
    beforeColumn.insert(beforeColumn.mapping.map(2 + paragraph.nodeSize), cell);
    beforeColumn.insert(beforeColumn.mapping.map(2 + paragraph.nodeSize + row.nodeSize), cell);
    const mapped = mapMenuTarget(target, [beforeTable, beforeColumn]);
    expect(mapped?.selected.$anchorCell.doc).toBe(beforeColumn.doc);
    expect(mapped?.anchor).toEqual({
      cell: 2 + paragraph.nodeSize + cell.nodeSize,
      index: 1,
      offset: 0,
    });
  });

  it("tracks a row grip through an inserted row", () => {
    const inserted = state.tr.insert(1, row);
    const mapped = mapMenuTarget({ ...target, kind: "row" }, [inserted]);
    expect(mapped?.anchor).toEqual({ cell: 2 + row.nodeSize, index: 1, offset: 0 });
  });

  it("dismisses a menu whose table was removed even when the next table moves into its place", () => {
    expect(mapMenuTarget(target, [state.tr.delete(0, table.nodeSize)])).toBeNull();
  });

  it("dismisses an unrelated explicit selection change", () => {
    expect(mapMenuTarget(target, [state.tr.setSelection(TextSelection.atEnd(doc))])).toBeNull();
  });
});

it("retains a dialog-owned target across focus selection changes but still invalidates deleted cells", () => {
  const moved = state.tr.setSelection(TextSelection.atEnd(doc));
  expect(mapMenuTarget(target, [moved], { dismissOnSelectionChange: false })).toBe(target);
  const shifted = state.tr.insert(0, paragraph);
  const mapped = mapMenuTarget(target, [shifted], { dismissOnSelectionChange: false });
  expect(mapped?.selected.$anchorCell.pos).toBe(selection.$anchorCell.pos + paragraph.nodeSize);
  expect(
    mapMenuTarget(target, [state.tr.delete(0, table.nodeSize)], { dismissOnSelectionChange: false })
  ).toBeNull();
});
