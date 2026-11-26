import { Editor } from "@tiptap/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createConversionExtensions, createExtensionKit } from "../extensions/extension-kit";
import { createDocumentStarterKit } from "../extensions/reading-schema";
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
});
