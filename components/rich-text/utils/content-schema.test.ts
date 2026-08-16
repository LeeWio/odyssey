import { describe, expect, it } from "vitest";

import { RICH_TEXT_DOCUMENT_FIXTURE } from "../testing/rich-text-document.fixture";
import {
  decodeRichTextPayload,
  RICH_TEXT_SCHEMA_ID,
  RICH_TEXT_SCHEMA_VERSION,
  RichTextSchemaError,
  serializeRichTextPayload,
} from "./content-schema";

describe("versioned rich text schema", () => {
  it("wraps persisted content with the current schema version", () => {
    const serialized = serializeRichTextPayload(RICH_TEXT_DOCUMENT_FIXTURE);
    const payload = JSON.parse(serialized);

    expect(payload.schema).toBe(RICH_TEXT_SCHEMA_ID);
    expect(payload.schemaVersion).toBe(RICH_TEXT_SCHEMA_VERSION);
    expect(decodeRichTextPayload(serialized)).toEqual({
      document: RICH_TEXT_DOCUMENT_FIXTURE,
      migrated: false,
      sourceVersion: RICH_TEXT_SCHEMA_VERSION,
    });
  });

  it("migrates legacy image attributes without mutating the source", () => {
    const legacy = {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "/legacy.png", alt: "Legacy", align: "right", width: 72 },
        },
      ],
    };
    const original = structuredClone(legacy);
    const decoded = decodeRichTextPayload(legacy);

    expect(decoded.migrated).toBe(true);
    expect(decoded.sourceVersion).toBe(1);
    expect(decoded.document.content?.[0].attrs).toEqual({
      src: "/legacy.png",
      alt: "Legacy",
      alignment: "right",
      widthPercent: 72,
      caption: "",
    });
    expect(legacy).toEqual(original);
  });

  it("rejects future versions instead of guessing how to load them", () => {
    expect(() =>
      decodeRichTextPayload({
        schema: RICH_TEXT_SCHEMA_ID,
        schemaVersion: RICH_TEXT_SCHEMA_VERSION + 1,
        document: RICH_TEXT_DOCUMENT_FIXTURE,
      })
    ).toThrowError(RichTextSchemaError);
  });
});
