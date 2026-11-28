import { Editor, type JSONContent } from "@tiptap/core";
import { CellSelection, selectedRect, TableMap } from "@tiptap/pm/tables";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";

import { ImageUploadSchema } from "../ImageUpload/image-upload-schema";
import { AttachmentSchema } from "../media/attachment-schema";
import { applyTableAction, moveTableAxisTo, tableAxisRange } from "./actions";
import { TableKit } from "./table";

let editor: Editor;
afterEach(() => editor?.destroy());

function open(content: string | JSONContent) {
  editor = new Editor({
    extensions: [StarterKit, TableKit, ImageUploadSchema, AttachmentSchema],
    content,
  });
}

function activeTable() {
  return editor.state.doc.firstChild!;
}

function select(top: number, left: number, bottom = top, right = left, tablePos = 0) {
  const { doc, tr } = editor.state;
  const map = TableMap.get(doc.nodeAt(tablePos)!);
  const start = tablePos + 1;
  editor.view.dispatch(
    tr.setSelection(
      CellSelection.create(
        doc,
        start + map.map[top * map.width + left],
        start + map.map[bottom * map.width + right]
      )
    )
  );
}

function cellTexts() {
  return activeTable().children.map((row) => row.children.map((cell) => cell.textContent));
}

describe("table actions", () => {
  it("clears the selected column including its header, then merges and splits an empty header with Role", () => {
    open(
      '<table><tr><th colwidth="120">Name</th><th colwidth="160">Role</th></tr><tr><td colwidth="120">Amy</td><td colwidth="160">Editor</td></tr></table>'
    );
    select(0, 0, 1, 0);
    expect(applyTableAction(editor, "column", "clear")).toBe(true);
    expect(cellTexts()).toEqual([
      ["", "Role"],
      ["", "Editor"],
    ]);
    expect(activeTable().firstChild!.firstChild!.type.name).toBe("tableHeader");
    expect(activeTable().firstChild!.firstChild!.attrs.colwidth).toEqual([120]);

    select(0, 0, 0, 1);
    expect(applyTableAction(editor, "cell", "merge")).toBe(true);
    expect(activeTable().firstChild!.childCount).toBe(1);
    expect(activeTable().firstChild!.firstChild!.textContent).toBe("Role");
    expect(activeTable().firstChild!.firstChild!.attrs).toMatchObject({
      colspan: 2,
      colwidth: [120, 160],
    });
    expect(applyTableAction(editor, "cell", "split")).toBe(true);
    expect(cellTexts()).toEqual([
      ["Role", ""],
      ["", "Editor"],
    ]);
    expect(activeTable().firstChild!.child(1).attrs.colwidth).toEqual([160]);
    expect(editor.commands.undo()).toBe(true);
    expect(activeTable().firstChild!.childCount).toBe(1);
    expect(editor.commands.undo()).toBe(true);
    expect(cellTexts()).toEqual([
      ["", "Role"],
      ["", "Editor"],
    ]);
    expect(editor.commands.undo()).toBe(true);
    expect(cellTexts()).toEqual([
      ["Name", "Role"],
      ["Amy", "Editor"],
    ]);
  });

  it("preserves every explicit width when merging the only row", () => {
    open('<table><tr><td colwidth="101">A</td><td colwidth="175">B</td></tr></table>');
    select(0, 0, 0, 1);
    applyTableAction(editor, "cell", "merge");
    expect(activeTable().firstChild!.firstChild!.attrs.colwidth).toEqual([101, 175]);
  });

  it("changes a mixed vertical selection even when the head already has the requested alignment", () => {
    open(
      '<table><tr><td>A</td><td>X</td></tr><tr><td style="text-align: center">B</td><td>Y</td></tr><tr><td>C</td><td>Z</td></tr></table>'
    );
    select(0, 0, 1, 0);
    const action = { attribute: "align", value: "center" } as const;
    const before = editor.state.doc;
    expect(applyTableAction(editor, "cell", action, false)).toBe(true);
    expect(editor.state.doc).toBe(before);
    expect(applyTableAction(editor, "cell", action)).toBe(true);
    expect(
      activeTable().children.map((row) => row.children.map((cell) => cell.attrs.align))
    ).toEqual([
      ["center", null],
      ["center", null],
      [null, null],
    ]);
    expect(applyTableAction(editor, "cell", action, false)).toBe(false);
    expect(editor.commands.undo()).toBe(true);
    expect(editor.state.doc.eq(before)).toBe(true);
  });

  it("toggles the selected column and keeps the intersecting header row", () => {
    open("<table><tr><th>A</th><th>B</th></tr><tr><td>a</td><td>b</td></tr></table>");
    select(0, 1, 1, 1);
    expect(applyTableAction(editor, "column", "header")).toBe(true);
    expect(
      activeTable()
        .child(1)
        .children.map((c) => c.type.name)
    ).toEqual(["tableCell", "tableHeader"]);
    expect(applyTableAction(editor, "column", "header")).toBe(true);
    expect(
      activeTable()
        .child(0)
        .children.map((c) => c.type.name)
    ).toEqual(["tableHeader", "tableHeader"]);
    expect(
      activeTable()
        .child(1)
        .children.map((c) => c.type.name)
    ).toEqual(["tableCell", "tableCell"]);
  });

  it("sorts stable records with blanks last in both directions and keeps rowspan groups and headers in place", () => {
    open(
      '<table><tr><th>Key</th><th>ID</th></tr><tr><td rowspan="2">Z</td><td>first</td></tr><tr><td>second</td></tr><tr><td></td><td>empty</td></tr><tr><td>a</td><td>1</td></tr><tr><td>A</td><td>2</td></tr><tr><th>Section</th><th>ID</th></tr><tr><td>B</td><td>3</td></tr></table>'
    );
    select(0, 0, 7, 0);
    expect(applyTableAction(editor, "column", "sort-asc")).toBe(true);
    const ids = () => activeTable().children.map((row) => row.lastChild!.textContent);
    expect(ids()).toEqual(["ID", "1", "2", "first", "second", "empty", "ID", "3"]);
    expect(applyTableAction(editor, "column", "sort-desc")).toBe(true);
    expect(ids()).toEqual(["ID", "first", "second", "1", "2", "empty", "ID", "3"]);
    expect(activeTable().child(1).firstChild!.attrs.rowspan).toBe(2);
    expect(TableMap.get(activeTable()).problems).toBe(null);
  });

  it("sorts by the clicked logical column when a spanning header selects a wider band", () => {
    open(
      "<table><tr><th colspan='2'>Group</th><th>ID</th></tr><tr><td>A</td><td>Z</td><td>1</td></tr><tr><td>B</td><td>A</td><td>2</td></tr></table>"
    );
    select(0, 0, 2, 1);
    expect(applyTableAction(editor, "column", "sort-asc", false, 2)).toBe(false);
    expect(applyTableAction(editor, "column", "sort-asc", false, 0)).toBe(false);
    expect(applyTableAction(editor, "column", "sort-asc", false, 1)).toBe(true);
    expect(applyTableAction(editor, "column", "sort-asc", true, 1)).toBe(true);
    expect(cellTexts()).toEqual([
      ["Group", "ID"],
      ["B", "A", "2"],
      ["A", "Z", "1"],
    ]);
    expect(selectedRect(editor.state)).toMatchObject({ left: 0, right: 2, bottom: 3 });
  });

  it("duplicates and moves complete colspan groups with their types, marks, and widths", () => {
    open(
      '<table><tr><th colspan="2" colwidth="111,125">Group</th><td colwidth="180">End</td></tr><tr><td colwidth="111"><strong>A</strong></td><td colwidth="125">B</td><td colwidth="180">C</td></tr></table>'
    );
    select(0, 0, 1, 1);
    expect(tableAxisRange(TableMap.get(activeTable()), "column", 1)).toEqual({ start: 0, end: 2 });
    expect(applyTableAction(editor, "column", "duplicate")).toBe(true);
    expect(cellTexts()).toEqual([
      ["Group", "Group", "End"],
      ["A", "B", "A", "B", "C"],
    ]);
    expect(selectedRect(editor.state)).toMatchObject({ left: 2, right: 4 });
    expect(moveTableAxisTo(editor, "column", 4)).toBe(true);
    expect(cellTexts()).toEqual([
      ["Group", "End", "Group"],
      ["A", "B", "C", "A", "B"],
    ]);
    expect(activeTable().firstChild!.lastChild!.type.name).toBe("tableHeader");
    expect(activeTable().firstChild!.lastChild!.attrs.colwidth).toEqual([111, 125]);
    expect(activeTable().child(1).child(3).firstChild!.firstChild!.marks[0].type.name).toBe("bold");
    expect(TableMap.get(activeTable()).problems).toBe(null);
    expect(selectedRect(editor.state)).toMatchObject({ left: 3, right: 5 });
    expect(moveTableAxisTo(editor, "column", 4)).toBe(false);
    expect(editor.commands.undo()).toBe(true);
    expect(cellTexts()[1]).toEqual(["A", "B", "A", "B", "C"]);
  });

  it("moves and duplicates a transitive chain of rowspans", () => {
    open(
      '<table><tr><td rowspan="2">A</td><td>b1</td></tr><tr><td rowspan="2">B</td></tr><tr><td>a3</td></tr><tr><td>C</td><td>c</td></tr></table>'
    );
    select(0, 0, 2, 1);
    expect(tableAxisRange(TableMap.get(activeTable()), "row", 1)).toEqual({ start: 0, end: 3 });
    expect(applyTableAction(editor, "row", "move-after")).toBe(true);
    expect(cellTexts()).toEqual([["C", "c"], ["A", "b1"], ["B"], ["a3"]]);
    expect(applyTableAction(editor, "row", "duplicate")).toBe(true);
    expect(cellTexts()).toEqual([
      ["C", "c"],
      ["A", "b1"],
      ["B"],
      ["a3"],
      ["A", "b1"],
      ["B"],
      ["a3"],
    ]);
    expect(TableMap.get(activeTable()).problems).toBe(null);
  });

  it.each([
    { type: "imageUpload", attrs: { fileKey: null } },
    { type: "imageUpload", attrs: { fileKey: "queued-file" } },
    { type: "attachment", attrs: { uploadId: "queued-file" } },
  ])("protects the $type node view during structural edits ($attrs)", (upload) => {
    const textCell = (text: string) => ({
      type: "tableCell",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    });
    open({
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            { type: "tableRow", content: [textCell("B"), textCell("1")] },
            {
              type: "tableRow",
              content: [textCell("A"), { type: "tableCell", content: [upload] }],
            },
          ],
        },
      ],
    });
    const viewForUpload = () => {
      const table = activeTable();
      const map = TableMap.get(table);
      const cellPos = map.map[map.map.length - 1] + 1;
      return editor.view.nodeDOM(cellPos + 1);
    };
    const dom = viewForUpload();
    expect(dom).not.toBeNull();
    select(0, 0, 1, 1);
    expect(applyTableAction(editor, "column", "distribute-columns")).toBe(true);
    expect(viewForUpload()).toBe(dom);
    expect(applyTableAction(editor, "column", { width: 180 })).toBe(true);
    expect(viewForUpload()).toBe(dom);
    expect(applyTableAction(editor, "column", "reset-column-widths")).toBe(true);
    expect(viewForUpload()).toBe(dom);
    select(0, 1, 1, 1);
    expect(applyTableAction(editor, "column", "duplicate", false)).toBe(false);
    const beforeMerge = editor.state.doc;
    expect(applyTableAction(editor, "cell", "merge", false)).toBe(false);
    expect(applyTableAction(editor, "cell", "merge")).toBe(false);
    expect(editor.state.doc).toBe(beforeMerge);
    expect(viewForUpload()).toBe(dom);
    select(0, 0, 0, 1);
    expect(applyTableAction(editor, "cell", "merge", false)).toBe(true);
    expect(applyTableAction(editor, "cell", "merge")).toBe(true);
    expect(viewForUpload()).toBe(dom);
    expect(editor.commands.undo()).toBe(true);
    select(0, 0, 1, 0);
    expect(applyTableAction(editor, "column", "sort-asc")).toBe(false);
    expect(applyTableAction(editor, "column", "move-after")).toBe(false);
    expect(applyTableAction(editor, "column", "duplicate")).toBe(true);
    expect(viewForUpload()).toBe(dom);
    select(0, 0, 0, 2);
    expect(applyTableAction(editor, "row", "duplicate")).toBe(true);
    expect(viewForUpload()).toBe(dom);
  });

  it("allows moving an attachment picker which has no active upload", () => {
    open({
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [{ type: "tableCell", content: [{ type: "attachment" }] }],
            },
            {
              type: "tableRow",
              content: [{ type: "tableCell", content: [{ type: "paragraph" }] }],
            },
          ],
        },
      ],
    });
    select(0, 0);
    expect(applyTableAction(editor, "row", "move-after")).toBe(true);
    expect(activeTable().lastChild!.firstChild!.firstChild!.type.name).toBe("attachment");
  });

  it("keeps deletion inside the target table and disables deletion of a final axis", () => {
    open(
      "<table><tr><td>First</td></tr></table><table><tr><td>Keep</td></tr><tr><td>Delete</td></tr></table>"
    );
    const tablePos = activeTable().nodeSize;
    select(1, 0, 1, 0, tablePos);
    expect(applyTableAction(editor, "row", "delete")).toBe(true);
    expect(selectedRect(editor.state).tableStart).toBe(tablePos + 1);
    expect(applyTableAction(editor, "row", "delete", false)).toBe(false);
    expect(applyTableAction(editor, "column", "delete", false)).toBe(false);
    expect(applyTableAction(editor, "row", "delete-table")).toBe(true);
    expect(cellTexts()).toEqual([["First"]]);
  });
});

it("restores a merged/inserted/moved/deleted table through each undo and redo", () => {
  open(
    '<table><tr><th colwidth="120">A</th><th colwidth="180">B</th><th colwidth="220">C</th></tr><tr><td colwidth="120">1</td><td colwidth="180">2</td><td colwidth="220">3</td></tr><tr><td colwidth="120">4</td><td colwidth="180">5</td><td colwidth="220">6</td></tr></table>'
  );
  select(0, 0, 0, 1);
  const snapshots = [editor.getJSON()];
  expect(applyTableAction(editor, "cell", "merge")).toBe(true);
  snapshots.push(editor.getJSON());
  select(0, 2, 2, 2);
  expect(applyTableAction(editor, "column", "insert-after")).toBe(true);
  snapshots.push(editor.getJSON());
  select(1, 0, 1, 3);
  expect(applyTableAction(editor, "row", "move-after")).toBe(true);
  snapshots.push(editor.getJSON());
  select(0, 2, 2, 2);
  expect(applyTableAction(editor, "column", "delete")).toBe(true);
  snapshots.push(editor.getJSON());
  for (let index = snapshots.length - 2; index >= 0; index--) {
    expect(editor.commands.undo()).toBe(true);
    expect(editor.getJSON()).toEqual(snapshots[index]);
    expect(TableMap.get(activeTable()).problems).toBeNull();
  }
  for (let index = 1; index < snapshots.length; index++) {
    expect(editor.commands.redo()).toBe(true);
    expect(editor.getJSON()).toEqual(snapshots[index]);
    expect(TableMap.get(activeTable()).problems).toBeNull();
  }
});
