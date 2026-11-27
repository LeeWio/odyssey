import { Editor } from "@tiptap/core";
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createConversionExtensions, createExtensionKit } from "../extensions/extension-kit";
import { createDocumentStarterKit, createReadingSchema } from "../extensions/reading-schema";
import { RICH_TEXT_DOCUMENT_FIXTURE } from "../testing/rich-text-document.fixture";
import {
  analyzeContentExport,
  analyzeContentImport,
  canImportContent,
} from "./content-interoperability";

describe("HTML import inspection", () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor({ extensions: createConversionExtensions() });
  });

  afterEach(() => editor.destroy());

  it("imports supported body content from an HTML document", () => {
    const analysis = analyzeContentImport(editor, "html", "<html><body><p>Draft</p></body></html>");

    expect(canImportContent(analysis)).toBe(true);
    expect(analysis.canonicalSource).toBe("<p>Draft</p>");
  });

  it("blocks unsupported tags even when the parser puts them in the document head", () => {
    const analysis = analyzeContentImport(
      editor,
      "html",
      "<style>p { color: red }</style><p>Draft</p>"
    );

    expect(canImportContent(analysis)).toBe(false);
    expect(analysis.warnings).toContainEqual({
      blocking: true,
      code: "unsupported-html",
      message: "Unsupported HTML elements would be removed: <style>.",
    });
  });

  it("rejects a known block in an invalid parent before enabling import", () => {
    const invalid = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "heading", content: [{ type: "text", text: "Nested" }] }],
        },
      ],
    };
    const result = analyzeContentImport(editor, "json", JSON.stringify(invalid));
    expect(canImportContent(result)).toBe(false);
    expect(result.warnings[0]).toMatchObject({ blocking: true, code: "invalid-content" });
  });

  it("imports its own HTML export including checked tasks and table columns", () => {
    editor.commands.setContent(RICH_TEXT_DOCUMENT_FIXTURE);
    const exported = analyzeContentExport(editor, "html");
    const imported = analyzeContentImport(editor, "html", exported.source);
    expect(canImportContent(imported)).toBe(true);
    expect(imported.canonicalSource).toContain('data-checked="true"');
    expect(imported.canonicalSource).toContain("<colgroup>");
  });

  it("treats code fences as text while inspecting raw HTML in Markdown", () => {
    const markdownEditor = new Editor({
      extensions: [createDocumentStarterKit(), ...createExtensionKit({ fileHandler: false })],
    });
    try {
      expect(
        canImportContent(
          analyzeContentImport(markdownEditor, "markdown", "```html\n<custom>example</custom>\n```")
        )
      ).toBe(true);
      expect(
        canImportContent(
          analyzeContentImport(markdownEditor, "markdown", "<custom>example</custom>")
        )
      ).toBe(false);
    } finally {
      markdownEditor.destroy();
    }
  });

  it("preserves a styled, resized and merged table through HTML, JSON and public rendering", () => {
    const html = `<table><tbody>
      <tr><th colspan="2" colwidth="130,175" style="background-color:#dbeafe; color:#123456; vertical-align:bottom; text-align:center"><p>Role</p></th></tr>
      <tr><td colwidth="130" style="vertical-align:middle;color:rgb(128,0,32);text-align:right"><p style="text-align:left">A <span style="color:rgb(18, 52, 86)">detail</span></p></td><td colwidth="175"><p>B</p></td></tr>
    </tbody></table>`;
    editor.commands.setContent(html);
    const saved = editor.getJSON();
    const table = editor.state.doc.child(0);
    const header = table.child(0).child(0);
    const body = table.child(1);
    expect(header.attrs).toMatchObject({
      align: "center",
      verticalAlign: "bottom",
      cellTextColor: "#123456",
      cellBackgroundColor: "#dbeafe",
      colspan: 2,
      colwidth: [130, 175],
    });
    expect(body.child(0).attrs).toMatchObject({
      align: "right",
      verticalAlign: "middle",
      cellTextColor: "#800020",
    });
    expect(body.child(1).attrs).toMatchObject({
      align: null,
      verticalAlign: null,
      cellTextColor: null,
      cellBackgroundColor: null,
    });

    const exported = analyzeContentExport(editor, "html");
    expect(exported.source).toContain("<colgroup>");
    const imported = analyzeContentImport(editor, "html", exported.source);
    expect(imported.document).toEqual(saved);
    expect(exported.warnings).toEqual([]);
    expect(imported.warnings).toEqual([]);
    expect(analyzeContentImport(editor, "json", JSON.stringify(saved)).document).toEqual(saved);

    const markup = renderToStaticMarkup(
      renderToReactElement({ content: saved, extensions: createReadingSchema() })
    );
    const dom = new DOMParser().parseFromString(markup, "text/html");
    const th = dom.querySelector("th")!;
    expect(th.colSpan).toBe(2);
    expect(th.style.backgroundColor).toBe("rgb(219, 234, 254)");
    expect(th.style.color).toBe("rgb(18, 52, 86)");
    expect(th.style.verticalAlign).toBe("bottom");
    expect(th.style.textAlign).toBe("center");
    expect([...dom.querySelectorAll("col")].map((col) => col.style.width)).toEqual([
      "130px",
      "175px",
    ]);
    const td = dom.querySelector("td")!;
    expect(td.style.textAlign).toBe("right");
    expect(td.querySelector("p")?.style.textAlign).toBe("left");
    expect(td.querySelector("span")?.style.color).toBe("rgb(18, 52, 86)");
  });

  it("keeps automatic cell ink readable in both themes without saving it as an authored color", () => {
    editor.commands.setContent(`<table><tbody><tr>
      <th style="background-color:#bfdbfe"><p>Pale</p></th>
      <td style="background-color:#123456"><p>Dark</p></td>
      <td style="background-color:#00000000"><p>Transparent</p></td>
      <td style="background-color:#bfdbfe;color:#123456"><p>Explicit <span style="color:rgb(128, 0, 32)">mark</span></p></td>
    </tr></tbody></table>`);
    const saved = editor.getJSON();
    const row = editor.state.doc.child(0).child(0);
    expect(row.content.content.map((cell) => cell.attrs.cellTextColor)).toEqual([
      null,
      null,
      null,
      "#123456",
    ]);

    const exported = analyzeContentExport(editor, "html");
    const imported = analyzeContentImport(editor, "html", exported.source);
    expect(exported.warnings).toEqual([]);
    expect(imported.warnings).toEqual([]);
    expect(imported.document).toEqual(saved);

    const reader = renderToStaticMarkup(
      renderToReactElement({ content: saved, extensions: createReadingSchema() })
    );
    for (const html of [editor.view.dom.innerHTML, exported.source, reader]) {
      const dom = new DOMParser().parseFromString(html, "text/html");
      const cells = [...dom.querySelectorAll<HTMLTableCellElement>("th, td")];
      expect(cells.map((cell) => cell.style.color)).toEqual([
        "light-dark(black, black)",
        "light-dark(white, white)",
        "light-dark(black, white)",
        "rgb(18, 52, 86)",
      ]);
      expect(cells[3].querySelector("span")?.style.color).toBe("rgb(128, 0, 32)");
    }
  });

  it("renders pre-formatting documents with default cell styles and omits invalid style values", () => {
    const cells = [
      { type: "tableHeader", content: [{ type: "paragraph" }] },
      {
        type: "tableCell",
        attrs: {
          cellBackgroundColor: "red; padding:10px",
          verticalAlign: "3px",
          cellTextColor: "var(--unknown)",
        },
        content: [{ type: "paragraph" }],
      },
    ];
    editor.commands.setContent({
      type: "doc",
      content: [{ type: "table", content: [{ type: "tableRow", content: cells }] }],
    });
    const rendered = editor.view.dom.querySelectorAll("th, td");
    expect(rendered).toHaveLength(2);
    for (const cell of rendered) {
      expect(cell.getAttribute("style")).toBeNull();
    }
  });
});
