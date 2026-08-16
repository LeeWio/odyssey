import type { JSONContent } from "@tiptap/core";

export const RICH_TEXT_SCHEMA_ID = "odyssey.rich-text";
export const RICH_TEXT_SCHEMA_VERSION = 2;

export interface VersionedRichTextDocument {
  schema: typeof RICH_TEXT_SCHEMA_ID;
  schemaVersion: typeof RICH_TEXT_SCHEMA_VERSION;
  document: JSONContent;
}

export interface DecodedRichTextDocument {
  document: JSONContent;
  migrated: boolean;
  sourceVersion: number;
}

export class RichTextSchemaError extends Error {
  constructor(
    message: string,
    readonly code: "invalid-document" | "unknown-schema" | "unsupported-version"
  ) {
    super(message);
    this.name = "RichTextSchemaError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isJSONContentTree(value: unknown): value is JSONContent {
  const pending: unknown[] = [value];

  while (pending.length > 0) {
    const node = pending.pop();
    if (!isRecord(node) || typeof node.type !== "string") return false;
    if (node.text !== undefined && typeof node.text !== "string") return false;
    if (node.attrs !== undefined && !isRecord(node.attrs)) return false;

    if (node.marks !== undefined) {
      if (!Array.isArray(node.marks)) return false;
      for (const mark of node.marks) {
        if (!isRecord(mark) || typeof mark.type !== "string") return false;
        if (mark.attrs !== undefined && !isRecord(mark.attrs)) return false;
      }
    }

    if (node.content !== undefined) {
      if (!Array.isArray(node.content)) return false;
      pending.push(...node.content);
    }
  }

  return true;
}

function assertDocument(value: unknown): asserts value is JSONContent {
  if (!isJSONContentTree(value) || value.type !== "doc" || !Array.isArray(value.content)) {
    throw new RichTextSchemaError(
      "The payload is not a valid Tiptap JSON document.",
      "invalid-document"
    );
  }
}

function migrateV1Node(node: JSONContent): JSONContent {
  const content = node.content?.map(migrateV1Node);
  const attrs = node.attrs ? { ...node.attrs } : undefined;

  if (node.type === "image" && attrs) {
    if (attrs.alignment === undefined && attrs.align !== undefined) attrs.alignment = attrs.align;
    if (attrs.widthPercent === undefined && typeof attrs.width === "number") {
      attrs.widthPercent = attrs.width;
    }
    attrs.caption ??= "";
    delete attrs.align;
    delete attrs.width;
  }

  return {
    ...node,
    ...(attrs ? { attrs } : {}),
    ...(content ? { content } : {}),
  };
}

export function decodeRichTextPayload(value: unknown): DecodedRichTextDocument {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      throw new RichTextSchemaError("The JSON payload cannot be parsed.", "invalid-document");
    }
  }

  if (isRecord(parsed) && parsed.type === "doc") {
    assertDocument(parsed);
    return { document: migrateV1Node(parsed), migrated: true, sourceVersion: 1 };
  }

  if (!isRecord(parsed) || parsed.schema !== RICH_TEXT_SCHEMA_ID) {
    throw new RichTextSchemaError(
      `Expected schema \"${RICH_TEXT_SCHEMA_ID}\" or a legacy Tiptap document.`,
      "unknown-schema"
    );
  }

  if (typeof parsed.schemaVersion !== "number") {
    throw new RichTextSchemaError("The schemaVersion field is missing.", "invalid-document");
  }
  if (parsed.schemaVersion > RICH_TEXT_SCHEMA_VERSION || parsed.schemaVersion < 1) {
    throw new RichTextSchemaError(
      `Schema version ${parsed.schemaVersion} is not supported by this editor.`,
      "unsupported-version"
    );
  }

  assertDocument(parsed.document);
  if (parsed.schemaVersion === 1) {
    return { document: migrateV1Node(parsed.document), migrated: true, sourceVersion: 1 };
  }

  return { document: parsed.document, migrated: false, sourceVersion: parsed.schemaVersion };
}

export function createVersionedRichTextDocument(document: JSONContent): VersionedRichTextDocument {
  assertDocument(document);
  return {
    schema: RICH_TEXT_SCHEMA_ID,
    schemaVersion: RICH_TEXT_SCHEMA_VERSION,
    document,
  };
}

export function serializeRichTextPayload(document: JSONContent, pretty = false): string {
  return JSON.stringify(createVersionedRichTextDocument(document), null, pretty ? 2 : undefined);
}
