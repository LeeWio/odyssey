import { generateHTML, generateJSON, type JSONContent } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { createConversionExtensions, createEditExtensionKit } from "./extension-kit";
import { createReadExtensionKit } from "./read-extension-kit";

describe("conversion extensions", () => {
  it("round-trips link and underline marks through the shared schema", () => {
    const document: JSONContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "linked",
              marks: [{ type: "link", attrs: { href: "https://example.com" } }],
            },
            {
              type: "text",
              text: " and underlined",
              marks: [{ type: "underline" }],
            },
          ],
        },
      ],
    };
    const extensions = createConversionExtensions();

    const html = generateHTML(document, extensions);
    const roundTripped = generateJSON(html, extensions);

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("<u> and underlined</u>");
    expect(roundTripped.content?.[0]?.content?.[0]?.marks?.[0]?.type).toBe("link");
    expect(roundTripped.content?.[0]?.content?.[1]?.marks?.[0]?.type).toBe("underline");
  });
});

describe("read vs edit extension kits", () => {
  it("keeps the read kit smaller than the edit kit", () => {
    const readNames = createReadExtensionKit().map((ext) => ext.name);
    const editNames = createEditExtensionKit().map((ext) => ext.name);

    expect(readNames).not.toContain("findAndReplace");
    expect(readNames).not.toContain("fileHandler");
    expect(readNames).not.toContain("markdown");
    expect(editNames).toEqual(expect.arrayContaining(["findAndReplace", "markdown"]));
    expect(editNames.length).toBeGreaterThan(readNames.length);
  });
});
