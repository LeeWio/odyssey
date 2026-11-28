import { Editor } from "@tiptap/core";
import { CellSelection, TableMap } from "@tiptap/pm/tables";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";
import { parseTableText, pasteTableText, serializeTableSelection } from "./clipboard";
import { TableKit } from "./table";

let editor: Editor;
afterEach(() => editor?.destroy());
function open(
  html = '<table><tr><th colwidth="120">Name</th><th colwidth="160">Role</th></tr><tr><td>Amy</td><td>Editor</td></tr></table>'
) {
  editor?.destroy();
  editor = new Editor({ extensions: [StarterKit, TableKit], content: html });
}
function select(top: number, left: number, bottom = top, right = left, reverse = false) {
  const map = TableMap.get(editor.state.doc.firstChild!);
  const a = 1 + map.map[top * map.width + left];
  const b = 1 + map.map[bottom * map.width + right];
  editor.view.dispatch(
    editor.state.tr.setSelection(
      CellSelection.create(editor.state.doc, reverse ? b : a, reverse ? a : b)
    )
  );
}
function clipboard(text: string, html = "") {
  return {
    clipboardData: { getData: (type: string) => (type === "text/html" ? html : text) },
  } as unknown as ClipboardEvent;
}
function rows() {
  return editor.state.doc.firstChild!.children.map((row) =>
    row.children.map((cell) => cell.textBetween(0, cell.content.size, "\n"))
  );
}

describe("spreadsheet text", () => {
  it("round-trips quoted delimiters, CRLF, empty fields and literal formulas", () => {
    expect(parseTableText('"a\tb"\t"a""b"\t\r\n"line 1\r\nline 2"\t=1+2\tlast\r\n')).toEqual([
      ["a\tb", 'a"b', ""],
      ["line 1\nline 2", "=1+2", "last"],
    ]);
    expect(parseTableText("a\tb\n\n")).toEqual([
      ["a", "b"],
      ["", ""],
    ]);
    expect(parseTableText('"unclosed\tvalue')).toBeNull();
    expect(parseTableText('"closed"bad\tvalue')).toBeNull();
  });
  it("bounds grid allocations and pads ragged rows without dropping empty columns", () => {
    expect(parseTableText("a\tb\t\nc\n")).toEqual([
      ["a", "b", ""],
      ["c", "", ""],
    ]);
    expect(parseTableText("x\t".repeat(10_001))).toBeNull();
    expect(parseTableText("x".repeat(1_000_001))).toBeNull();
  });
  it("copies logical rows in document order for a reverse selection", () => {
    open();
    select(0, 0, 1, 1, true);
    expect(serializeTableSelection(editor.state.selection as CellSelection)).toBe(
      "Name\tRole\nAmy\tEditor"
    );
    expect(editor.view.serializeForClipboard(editor.state.selection.content()).text).toBe(
      "Name\tRole\nAmy\tEditor"
    );
  });
  it("keeps merged cells in a rectangular text grid and retains multiline cell values", () => {
    open(
      '<table><tr><th colspan="2"><p>A</p><p>B</p></th></tr><tr><td>C</td><td>D</td></tr></table>'
    );
    select(0, 0, 1, 1);
    const text = serializeTableSelection(editor.state.selection as CellSelection);
    expect(text).toBe('"A\nB"\t\nC\tD');
    expect(parseTableText(text)).toEqual([
      ["A\nB", ""],
      ["C", "D"],
    ]);
  });
  it("delegates rich HTML and prose outside a table", () => {
    open();
    select(0, 0);
    expect(
      pasteTableText(editor.view, clipboard("A\tB", "<table><tr><td>A</td><td>B</td></tr></table>"))
    ).toBe(false);
    expect(pasteTableText(editor.view, clipboard("Ordinary prose"))).toBe(false);
    open("<p>Outside</p>");
    expect(pasteTableText(editor.view, clipboard("A\tB"))).toBe(false);
    editor.commands.setTextSelection({ from: 1, to: 8 });
    expect(editor.view.serializeForClipboard(editor.state.selection.content()).text).toBe(
      "Outside"
    );
  });
  it("preserves destination headers, colors and widths while replacing a selected range", () => {
    open();
    select(0, 0, 1, 1);
    editor.view.dispatch(editor.state.tr.setNodeAttribute(2, "cellBackgroundColor", "#bfdbfe"));
    expect(pasteTableText(editor.view, clipboard("A\tB\nC\tD"))).toBe(true);
    expect(rows()).toEqual([
      ["A", "B"],
      ["C", "D"],
    ]);
    const header = editor.state.doc.firstChild!.firstChild!.firstChild!;
    expect(header.type.name).toBe("tableHeader");
    expect(header.attrs).toMatchObject({ colwidth: [120], cellBackgroundColor: "#bfdbfe" });
    expect(editor.commands.undo()).toBe(true);
    expect(rows()).toEqual([
      ["Name", "Role"],
      ["Amy", "Editor"],
    ]);
    expect(editor.state.doc.firstChild!.firstChild!.firstChild!.attrs.cellBackgroundColor).toBe(
      "#bfdbfe"
    );
  });
  it("grows a table from a caret and keeps the paste separate from adjacent typing", () => {
    open();
    editor.commands.setTextSelection(3);
    editor.commands.insertContent("Typed");
    expect(pasteTableText(editor.view, clipboard("A\tB\tC\nD\tE\tF\nG\tH\tI"))).toBe(true);
    expect(rows()).toEqual([
      ["A", "B", "C"],
      ["D", "E", "F"],
      ["G", "H", "I"],
    ]);
    expect(TableMap.get(editor.state.doc.firstChild!).problems).toBeNull();
    editor.commands.undo();
    expect(rows()[0][0]).toBe("TypedName");
    editor.commands.undo();
    expect(rows()[0][0]).toBe("Name");
  });
  it("tiles a small grid across an explicit larger selection", () => {
    open();
    select(0, 0, 1, 1);
    pasteTableText(editor.view, clipboard("X\tY"));
    expect(rows()).toEqual([
      ["X", "Y"],
      ["X", "Y"],
    ]);
    select(0, 0, 1, 0);
    pasteTableText(editor.view, clipboard("Top\nBottom\n"));
    expect(rows()).toEqual([
      ["Top", "Y"],
      ["Bottom", "Y"],
    ]);
  });
  it("splits a merged destination using native table repair while retaining column widths", () => {
    open(
      '<table><tr><th colspan="2" colwidth="120,160">Merged</th></tr><tr><td>Amy</td><td>Editor</td></tr></table>'
    );
    editor.commands.setTextSelection(3);
    pasteTableText(editor.view, clipboard("A\tB"));
    expect(rows()[0]).toEqual(["A", "B"]);
    expect(
      editor.state.doc.firstChild!.firstChild!.children.map((cell) => cell.attrs.colwidth)
    ).toEqual([[120], [160]]);
    expect(TableMap.get(editor.state.doc.firstChild!).problems).toBeNull();
    editor.commands.undo();
    expect(editor.state.doc.firstChild!.firstChild!.firstChild!.attrs.colspan).toBe(2);
  });
});

it("leaves code blocks inside cells as code and refuses read-only grid pastes", () => {
  open("<table><tr><td><pre><code>code</code></pre></td><td>Other</td></tr></table>");
  editor.commands.setTextSelection(3);
  expect(pasteTableText(editor.view, clipboard("A\tB"))).toBe(false);
  select(0, 0);
  editor.setEditable(false);
  expect(pasteTableText(editor.view, clipboard("A\tB"))).toBe(false);
});
