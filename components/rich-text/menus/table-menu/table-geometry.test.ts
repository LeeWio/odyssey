import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { CellSelection, TableMap } from "@tiptap/pm/tables";
import { afterEach, expect, it, vi } from "vitest";
import { TableKit } from "../../extensions/table/table";
import { tableLayoutReader } from "./table-geometry";
let editor: Editor;
afterEach(() => {
  editor?.destroy();
  vi.restoreAllMocks();
});
it("shares columns inside one synchronous pass and remeasures live DOM changes on the next pass", () => {
  editor = new Editor({
    extensions: [StarterKit, TableKit],
    content: "<table><tr><th>A</th><th>B</th></tr><tr><td>C</td><td>D</td></tr></table>",
  });
  const table = editor.view.dom.querySelector("table")!;
  const rect = (x: number, y: number, width: number, height: number) =>
    new DOMRect(x, y, width, height);
  vi.spyOn(editor.view.dom, "getBoundingClientRect").mockReturnValue(rect(0, 0, 500, 500));
  vi.spyOn(table, "getBoundingClientRect").mockReturnValue(rect(50, 50, 200, 80));
  vi.spyOn(table.parentElement!, "getBoundingClientRect").mockReturnValue(rect(49, 49, 202, 82));
  Array.from(table.rows).forEach((row, i) =>
    vi.spyOn(row, "getBoundingClientRect").mockReturnValue(rect(50, 50 + i * 40, 200, 40))
  );
  let firstWidth = 100;
  const cols = Array.from(table.querySelectorAll("col"));
  const reads = cols.map((col, i) =>
    vi
      .spyOn(col, "getBoundingClientRect")
      .mockImplementation(() =>
        rect(i ? 50 + firstWidth : 50, 50, i ? 200 - firstWidth : firstWidth, 80)
      )
  );
  const map = TableMap.get(editor.state.doc.firstChild!);
  const first = editor.state.doc.resolve(1 + map.map[0]);
  const second = editor.state.doc.resolve(1 + map.map[1]);
  const read = tableLayoutReader(editor.view);
  expect(read(first, new CellSelection(first))?.boxes.column?.width).toBe(100);
  expect(read(second, null)?.boxes.column?.width).toBe(100);
  reads.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
  // Native resizing changes col DOM before it writes the document.
  const doc = editor.state.doc;
  firstWidth = 130;
  const next = tableLayoutReader(editor.view);
  expect(next(first, null)?.boxes.column?.width).toBe(130);
  expect(next(second, null)?.boxes.column?.width).toBe(70);
  reads.forEach((spy) => expect(spy).toHaveBeenCalledTimes(2));
  expect(editor.state.doc).toBe(doc);
});
