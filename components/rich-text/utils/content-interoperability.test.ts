import { Editor } from "@tiptap/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createConversionExtensions } from "../extensions/extension-kit";
import { analyzeContentImport, canImportContent } from "./content-interoperability";

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
});
