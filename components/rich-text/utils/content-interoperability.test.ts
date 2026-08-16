import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";

import { ExtensionKit } from "../extensions/extension-kit";
import {
  COMMON_HTML_FIXTURE,
  COMMON_INTEROPERABILITY_DOCUMENT,
  COMMON_MARKDOWN_FIXTURE,
} from "../testing/content-interoperability.fixture";
import { serializeRichTextPayload } from "./content-schema";
import {
  analyzeContentExport,
  analyzeContentImport,
  canImportContent,
} from "./content-interoperability";

describe("content interoperability", () => {
  let editor: Editor | undefined;

  afterEach(() => editor?.destroy());

  const createEditor = (content = COMMON_INTEROPERABILITY_DOCUMENT) => {
    editor = new Editor({ content, extensions: [StarterKit, ...ExtensionKit] });
    return editor;
  };

  it("round-trips common Markdown nodes without a loss warning", () => {
    const currentEditor = createEditor();
    const imported = analyzeContentImport(currentEditor, "markdown", COMMON_MARKDOWN_FIXTURE);

    expect(canImportContent(imported)).toBe(true);
    expect(imported.warnings).toEqual([]);
    expect(imported.document?.content?.map((node) => node.type)).toEqual(
      expect.arrayContaining([
        "heading",
        "paragraph",
        "blockquote",
        "bulletList",
        "orderedList",
        "taskList",
        "codeBlock",
        "table",
      ])
    );
  });

  it("round-trips common HTML nodes without a loss warning", () => {
    const currentEditor = createEditor();
    const imported = analyzeContentImport(currentEditor, "html", COMMON_HTML_FIXTURE);

    expect(canImportContent(imported)).toBe(true);
    expect(imported.warnings).toEqual([]);
  });

  it("preserves extended image metadata and attachments in Markdown", () => {
    const currentEditor = createEditor({
      type: "doc",
      content: [
        COMMON_INTEROPERABILITY_DOCUMENT.content!.at(-1)!,
        {
          type: "attachment",
          attrs: {
            src: "https://example.com/fixture.pdf",
            fileName: "fixture.pdf",
            fileSize: 128,
            mimeType: "application/pdf",
          },
        },
      ],
    });
    const exported = analyzeContentExport(currentEditor, "markdown");
    const imported = analyzeContentImport(currentEditor, "markdown", exported.source);

    expect(exported.warnings).toEqual([]);
    expect(imported.warnings).toEqual([]);
    expect(imported.document?.content?.map((node) => node.type)).toEqual(["image", "attachment"]);
    expect(imported.document?.content?.[0].attrs).toMatchObject({
      alignment: "left",
      caption: "A preserved caption",
      widthPercent: 65,
    });
  });

  it("blocks unsupported JSON nodes and HTML elements with a visible reason", () => {
    const currentEditor = createEditor();
    const json = analyzeContentImport(
      currentEditor,
      "json",
      serializeRichTextPayload({ type: "doc", content: [{ type: "unsupportedWidget" }] })
    );
    const html = analyzeContentImport(currentEditor, "html", "<p>Safe</p><video src='x'></video>");

    expect(canImportContent(json)).toBe(false);
    expect(json.warnings[0]).toMatchObject({ blocking: true, code: "invalid-content" });
    expect(canImportContent(html)).toBe(false);
    expect(html.warnings[0]).toMatchObject({ blocking: true, code: "unsupported-html" });
    expect(html.warnings[0].message).toContain("<video>");
  });
});
