import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { CellSelection, TableMap } from "@tiptap/pm/tables";
import { afterEach, expect, it } from "vitest";
import { TableKit } from "./table";
import { exitTable, leaveCellSelection } from "./keyboard";

let editor: Editor;
afterEach(() => editor?.destroy());
const html = "<table><tr><td>A</td><td>B</td></tr></table>";
function open(content = html) {
  editor = new Editor({
    extensions: [StarterKit.configure({ trailingNode: false }), TableKit],
    content,
  });
}
function select() {
  let pos = 0;
  editor.state.doc.descendants((node, p) => {
    if (node.type.spec.tableRole === "table") pos = p;
  });
  const map = TableMap.get(editor.state.doc.nodeAt(pos)!);
  editor.view.dispatch(
    editor.state.tr.setSelection(
      CellSelection.create(editor.state.doc, pos + 1 + map.map[0], pos + 1 + map.map[1])
    )
  );
}
it("exits a selected range into its head cell without a document write", () => {
  open();
  select();
  const doc = editor.state.doc;
  expect(leaveCellSelection(editor)).toBe(true);
  expect(editor.state.selection.$from.parent.textContent).toBe("B");
  expect(editor.state.doc).toBe(doc);
  expect(leaveCellSelection(editor)).toBe(false);
});
it("inserts an exit paragraph after/before a terminal table and undoes only that insertion", () => {
  for (const before of [false, true]) {
    editor?.destroy();
    open();
    select();
    const doc = editor.state.doc;
    expect(exitTable(editor, before)).toBe(true);
    expect(editor.state.doc.childCount).toBe(2);
    expect(editor.state.selection.$from.parent.type.name).toBe("paragraph");
    expect(
      before ? editor.state.doc.firstChild!.type.name : editor.state.doc.lastChild!.type.name
    ).toBe("paragraph");
    expect(editor.commands.undo()).toBe(true);
    expect(editor.state.doc.eq(doc)).toBe(true);
  }
});
it("reuses neighboring paragraphs with no extra blank blocks and refuses read-only changes", () => {
  open("<p>Before</p>" + html + "<p>After</p>");
  select();
  expect(exitTable(editor)).toBe(true);
  expect(editor.state.selection.$from.parent.textContent).toBe("After");
  select();
  expect(exitTable(editor, true)).toBe(true);
  expect(editor.state.selection.$from.parent.textContent).toBe("Before");
  expect(editor.state.doc.childCount).toBe(3);
  select();
  editor.setEditable(false);
  expect(exitTable(editor)).toBe(false);
  expect(leaveCellSelection(editor)).toBe(false);
});
it("preserves the embedded code-block shortcut instead of exiting the containing table", () => {
  open("<table><tr><td><pre><code>const value = 1</code></pre></td></tr></table>");
  let position = 0;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.spec.code) position = pos + 1;
  });
  editor.commands.setTextSelection(position);
  const doc = editor.state.doc;
  expect(exitTable(editor)).toBe(false);
  expect(editor.state.doc).toBe(doc);
});
