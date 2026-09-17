import { generateHTML, generateJSON, type JSONContent } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import {
  createConversionExtensions,
  createExtensionKit,
  createReaderExtensionKit,
} from "./extension-kit";

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

describe("shared extension kit", () => {
  it("includes edit-only plugins by default", () => {
    const names = createExtensionKit().map((ext) => ext.name);

    expect(names).toEqual(
      expect.arrayContaining([
        "emoji",
        "findAndReplace",
        "markdown",
        "image",
        "Mathematics",
        "fileHandler",
      ])
    );
  });

  it("lets readers omit edit-only plugins while keeping schema nodes", () => {
    const names = createReaderExtensionKit().map((ext) => ext.name);

    expect(names).toEqual(
      expect.arrayContaining(["emoji", "image", "Mathematics", "audio", "attachment"])
    );
    expect(names).not.toContain("findAndReplace");
    expect(names).not.toContain("markdown");
    expect(names).not.toContain("fileHandler");
  });

  it("returns distinct configured plugin instances per call", () => {
    const first = createExtensionKit();
    const second = createExtensionKit();

    expect(first).not.toBe(second);

    const firstFind = first.find((ext) => ext.name === "findAndReplace");
    const secondFind = second.find((ext) => ext.name === "findAndReplace");
    expect(firstFind).toBeDefined();
    expect(secondFind).toBeDefined();
    expect(firstFind).not.toBe(secondFind);
  });
});
