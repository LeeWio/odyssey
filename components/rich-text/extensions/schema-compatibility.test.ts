import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";

import { RICH_TEXT_DOCUMENT_FIXTURE } from "../testing/rich-text-document.fixture";
import { ExtensionKit } from "./extension-kit";

describe("rich text schema compatibility", () => {
  const schema = getSchema([StarterKit, ...ExtensionKit]);

  it("accepts the representative persisted article without dropping nodes", () => {
    const document = schema.nodeFromJSON(RICH_TEXT_DOCUMENT_FIXTURE);
    const canonicalDocument = document.toJSON();
    const persistedNodeTypes = new Set<string>();

    document.descendants((node) => {
      persistedNodeTypes.add(node.type.name);
    });

    expect(schema.nodeFromJSON(canonicalDocument).toJSON()).toEqual(canonicalDocument);
    expect(document.textContent).toContain("Odyssey schema fixture");
    expect(persistedNodeTypes).toEqual(
      expect.objectContaining({
        size: expect.any(Number),
      })
    );
    expect([...persistedNodeTypes]).toEqual(
      expect.arrayContaining([
        "attachment",
        "audio",
        "blockMath",
        "columns",
        "details",
        "image",
        "inlineMath",
        "table",
        "taskItem",
        "taskList",
        "youtube",
      ])
    );
  });

  it("keeps every persisted custom node and mark registered", () => {
    expect(Object.keys(schema.nodes)).toEqual(
      expect.arrayContaining([
        "attachment",
        "audio",
        "blockMath",
        "column",
        "columns",
        "details",
        "detailsContent",
        "detailsSummary",
        "emoji",
        "image",
        "inlineMath",
        "table",
        "tableCell",
        "tableHeader",
        "tableRow",
        "taskItem",
        "taskList",
        "youtube",
      ])
    );
    expect(Object.keys(schema.marks)).toEqual(
      expect.arrayContaining(["bold", "link", "subscript", "superscript", "textStyle", "underline"])
    );
  });
});
