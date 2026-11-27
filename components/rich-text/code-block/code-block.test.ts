import { Editor, generateHTML, generateJSON, type JSONContent } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import { normalizeRichTextDocument } from "../utils/document-normalizer";
import { HighlightedCodeBlockSchema } from "./code-block-schema";
import { getSnippetLabel, readCodeSnippets } from "./code-snippets";
import { highlightCode } from "./highlight-code";

const snippets = [
  {
    name: 'example "one" & more.ts',
    language: "ts",
    code: '  const value = "<script>";\n\n\tvalue;\n',
  },
  { language: null, code: "" },
];
const document: JSONContent = {
  type: "doc",
  content: [
    {
      type: "highlightedCodeBlock",
      attrs: { chrome: "segment", frame: "inset", snippets, showLineNumbers: false },
    },
  ],
};

describe("highlighted code block", () => {
  it("round-trips snippets and line number preferences through HTML and Markdown", () => {
    const extensions = [StarterKit, HighlightedCodeBlockSchema, Markdown];
    const html = generateHTML(document, extensions);
    expect(html).toContain("&lt;script&gt;");
    expect(generateJSON(html, extensions)).toEqual(document);
    const legacyHtml = html.replace(' data-show-line-numbers="false"', "");
    expect(generateJSON(legacyHtml, extensions).content?.[0]?.attrs).toMatchObject({
      frame: "inset",
      showLineNumbers: true,
    });

    const editor = new Editor({ extensions });
    try {
      const markdown = editor.markdown!.serialize(document);
      expect(editor.markdown!.parse(markdown)).toEqual(document);
      expect(editor.markdown!.parse("```ts\nconst ordinary = true;\n```").content?.[0]?.type).toBe(
        "codeBlock"
      );
    } finally {
      editor.destroy();
    }
  });

  it.each(["windows", "none"])("round-trips %s chrome with a solid frame", (chrome) => {
    const extensions = [StarterKit, HighlightedCodeBlockSchema, Markdown];
    const content = {
      ...document,
      content: [
        {
          ...document.content![0],
          attrs: { chrome, frame: "solid", snippets: snippets.slice(0, 1), showLineNumbers: false },
        },
      ],
    };
    const html = generateHTML(content, extensions);
    expect(html).toContain('data-frame="solid"');
    expect(generateJSON(html, extensions)).toEqual(content);
    const editor = new Editor({ extensions });
    try {
      const markdown = editor.markdown!.serialize(content);
      expect(editor.markdown!.parse(markdown)).toEqual(content);
    } finally {
      editor.destroy();
    }
  });

  it.each(["windows", "none"])("preserves all legacy %s snippets in Segment", (chrome) => {
    const extensions = [StarterKit, HighlightedCodeBlockSchema, Markdown];
    const legacyDocument = {
      ...document,
      content: [
        {
          ...document.content![0],
          attrs: { chrome, frame: "inset", snippets, showLineNumbers: false },
        },
      ],
    };
    const legacyHtml = generateHTML(document, extensions).replace(
      'data-highlighted-code-block=""',
      `data-highlighted-code-block="" data-chrome="${chrome}"`
    );
    expect(normalizeRichTextDocument(legacyDocument)).toEqual(document);
    expect(generateJSON(legacyHtml, extensions)).toEqual(document);
    expect(generateHTML(legacyDocument, extensions)).not.toContain("data-chrome");
    const editor = new Editor({ extensions });
    try {
      const legacyMarkdown = editor
        .markdown!.serialize(document)
        .replace(
          'data-highlighted-code-block=""',
          `data-highlighted-code-block="" data-chrome="${chrome}"`
        );
      expect(editor.markdown!.parse(legacyMarkdown)).toEqual(document);
      expect(editor.markdown!.parse(editor.markdown!.serialize(legacyDocument))).toEqual(document);
    } finally {
      editor.destroy();
    }
  });

  it("labels unnamed legacy snippets using their language or the localized fallback", () => {
    const [typed, plain] = readCodeSnippets([
      { language: "ts", code: "" },
      { language: null, code: "" },
    ]);
    expect(getSnippetLabel(typed!, "Untitled")).toBe("TypeScript");
    expect(getSnippetLabel(plain!, "Untitled")).toBe("Untitled");
  });

  it("uses Shiki aliases and themes, with a plain fallback for unknown languages", async () => {
    const tokens = await highlightCode(snippets[0]!);
    const keyword = tokens?.flat().find(({ content }) => content === "const");
    expect(keyword?.htmlStyle).toMatchObject({ color: "#D73A49", "--shiki-dark": "#F97583" });
    await expect(highlightCode({ language: "unknown", code: "sample" })).resolves.toBeNull();
  });
});
