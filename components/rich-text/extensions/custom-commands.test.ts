import { Editor, type JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";

import { Column } from "./multi-column/column";
import {
  Columns,
  getColumnCountAtSelection,
  getColumnWidthsAtSelection,
} from "./multi-column/columns";
import { Indent } from "./indent/indent";

const editors: Editor[] = [];

function createEditor(content: JSONContent) {
  const editor = new Editor({
    content,
    element: document.createElement("div"),
    extensions: [StarterKit, Indent, Column, Columns],
  });
  editors.push(editor);
  return editor;
}

afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy());
});

describe("Indent commands", () => {
  it("increments, decrements and clamps paragraph indentation", () => {
    const editor = createEditor({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Indented" }] }],
    });

    expect(editor.commands.indent()).toBe(true);
    expect(editor.getAttributes("paragraph").indent).toBe(1);
    expect(editor.commands.outdent()).toBe(true);
    expect(editor.getAttributes("paragraph").indent).toBe(0);
    expect(editor.commands.outdent()).toBe(false);

    for (let index = 0; index < 12; index += 1) editor.commands.indent();
    expect(editor.getAttributes("paragraph").indent).toBe(10);
    expect(editor.commands.indent()).toBe(false);
  });
});

describe("Columns commands", () => {
  it("does not add an extra empty block when reducing column count", () => {
    const editor = createEditor({ type: "doc", content: [{ type: "paragraph" }] });

    expect(editor.commands.insertColumns(3)).toBe(true);
    expect(editor.commands.setColumnCount(2)).toBe(true);

    const json = editor.getJSON();
    const columns = json.content?.find((node) => node.type === "columns");

    // The second column should only have ONE child paragraph
    const secondColumn = columns?.content?.[1];
    expect(secondColumn?.content?.length).toBe(1);
  });

  it("inserts columns, changes count and normalizes widths", () => {
    const editor = createEditor({ type: "doc", content: [{ type: "paragraph" }] });

    expect(editor.commands.insertColumns(2)).toBe(true);
    expect(getColumnCountAtSelection(editor.state)).toBe(2);
    expect(getColumnWidthsAtSelection(editor.state)).toEqual([50, 50]);

    expect(editor.commands.setColumnCount(3)).toBe(true);
    expect(getColumnCountAtSelection(editor.state)).toBe(3);
    expect(editor.commands.setColumnWidths([2, 1, 1])).toBe(true);
    expect(getColumnWidthsAtSelection(editor.state)).toEqual([50, 25, 25]);

    expect(editor.commands.unsetColumns()).toBe(true);
    expect(editor.getJSON().content?.every((node) => node.type !== "columns")).toBe(true);
  });
});
