import { Editor, type JSONContent } from "@tiptap/core";
import { CellSelection, TableMap } from "@tiptap/pm/tables";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";
import { applyTableAction } from "./actions";
import { TableKit } from "./table";

let editor: Editor;
afterEach(() => editor?.destroy());
function open(content: string | JSONContent) {
  editor?.destroy();
  editor = new Editor({ extensions: [StarterKit, TableKit], content });
}
function select(left: number, right: number) {
  const table = editor.state.doc.firstChild!;
  const map = TableMap.get(table);
  editor.view.dispatch(
    editor.state.tr.setSelection(
      CellSelection.create(
        editor.state.doc,
        1 + map.map[left],
        1 + map.map[(map.height - 1) * map.width + right]
      )
    )
  );
}
function widths() {
  return editor.state.doc.firstChild!.children.map((row) =>
    row.children.map((cell) => cell.attrs.colwidth)
  );
}

describe("selected column widths", () => {
  it("distributes merged and rowspan tracks, preserves unselected columns, and undoes once", () => {
    open(
      '<table><tr><th colspan="2" colwidth="110,190">Group</th><th colwidth="410">Other</th></tr><tr><td rowspan="2" colwidth="110">A</td><td colwidth="190">B</td><td colwidth="410">C</td></tr><tr><td colwidth="190">D</td><td colwidth="410">E</td></tr></table>'
    );
    select(0, 1);
    const before = editor.getJSON();
    expect(applyTableAction(editor, "column", "distribute-columns", false)).toBe(true);
    expect(editor.getJSON()).toEqual(before);
    expect(applyTableAction(editor, "column", "distribute-columns")).toBe(true);
    expect(widths()).toEqual([
      [[150, 150], [410]],
      [[150], [150], [410]],
      [[150], [410]],
    ]);
    expect(TableMap.get(editor.state.doc.firstChild!).problems).toBeNull();
    expect(applyTableAction(editor, "column", "distribute-columns", false)).toBe(false);
    const html = editor.getHTML();
    const after = editor.getJSON();
    expect(editor.commands.undo()).toBe(true);
    expect(editor.getJSON()).toEqual(before);
    expect(editor.commands.redo()).toBe(true);
    expect(editor.getJSON()).toEqual(after);
    open(html);
    expect(widths()).toEqual([
      [[150, 150], [410]],
      [[150], [150], [410]],
      [[150], [410]],
    ]);
  });
  it("keeps integer remainders and the configured minimum width", () => {
    open('<table><tr><td colwidth="101">A</td><td colwidth="200">B</td></tr></table>');
    select(0, 1);
    expect(applyTableAction(editor, "column", "distribute-columns")).toBe(true);
    expect(widths()).toEqual([[[151], [150]]]);
    open('<table><tr><td colwidth="10">A</td><td colwidth="30">B</td></tr></table>');
    select(0, 1);
    applyTableAction(editor, "column", "distribute-columns");
    expect(widths()).toEqual([[[100], [100]]]);
  });
  it("resets selected columns, round trips automatic vectors, and has one undo", () => {
    open(
      '<table><tr><th colspan="2" colwidth="110,190">Group</th><th colwidth="410">Other</th></tr><tr><td colwidth="110">A</td><td colwidth="190">B</td><td colwidth="410">C</td></tr></table>'
    );
    select(0, 1);
    const before = editor.getJSON();
    expect(applyTableAction(editor, "column", "reset-column-widths")).toBe(true);
    expect(widths()).toEqual([
      [null, [410]],
      [null, null, [410]],
    ]);
    expect(applyTableAction(editor, "column", "reset-column-widths", false)).toBe(false);
    const after = editor.getJSON();
    const html = editor.getHTML();
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(before);
    editor.commands.redo();
    expect(editor.getJSON()).toEqual(after);
    open(html);
    expect(widths()).toEqual([
      [null, [410]],
      [null, null, [410]],
    ]);
  });
  it("supports resetting one column but refuses distribution of one column or read-only writes", () => {
    open('<table><tr><td colwidth="120">A</td><td colwidth="160">B</td></tr></table>');
    select(0, 0);
    expect(applyTableAction(editor, "column", "distribute-columns")).toBe(false);
    expect(applyTableAction(editor, "cell", "reset-column-widths")).toBe(false);
    expect(applyTableAction(editor, "column", "reset-column-widths")).toBe(true);
    expect(widths()).toEqual([[null, [160]]]);
    select(0, 1);
    editor.setEditable(false);
    expect(applyTableAction(editor, "column", "distribute-columns")).toBe(false);
  });
});
