import { generateHTML, generateJSON, type JSONContent } from "@tiptap/core";
import { describe, expect, it } from "vitest";

import { createConversionExtensions } from "@/components/rich-text/extensions/extension-kit";
import { normalizeRichTextDocument } from "@/components/rich-text/utils/document-normalizer";

describe("heading extension", () => {
  it("renders supported levels with a style hook", () => {
    const document: JSONContent = {
      type: "doc",
      content: [1, 2, 3].map((level) => ({
        type: "heading",
        attrs: { level },
        content: [{ type: "text", text: `Level ${level}` }],
      })),
    };

    const html = generateHTML(document, createConversionExtensions());

    expect(html).toContain("<h1>Level 1</h1>");
    expect(html).toContain("<h2>Level 2</h2>");
    expect(html).toContain("<h3>Level 3</h3>");
  });

  it("renders an unsupported level as the first supported heading", () => {
    const html = generateHTML(
      {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 5 },
            content: [{ type: "text", text: "Too deep" }],
          },
        ],
      },
      createConversionExtensions()
    );

    expect(html).toContain("<h1>Too deep</h1>");
    expect(html).not.toContain("<h5");
  });

  it("stores an unsupported level as the first supported level", () => {
    const normalized = normalizeRichTextDocument({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 4 }, content: [{ type: "text", text: "Deep" }] },
      ],
    });

    expect(normalized.content?.[0]?.attrs?.level).toBe(1);

    const roundTripped = generateJSON(
      generateHTML(normalized, createConversionExtensions()),
      createConversionExtensions()
    );
    expect(roundTripped.content?.[0]?.attrs?.level).toBe(1);
  });
});
