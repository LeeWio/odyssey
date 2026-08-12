import type { JSONContent } from "@tiptap/react";

// The minimal valid, standard ProseMirror document structure
export const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJSONContentTree(value: unknown): value is JSONContent {
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

export function parseJSONContent(value: unknown): JSONContent | null {
  if (typeof value === "string") {
    try {
      return parseJSONContent(JSON.parse(value));
    } catch {
      return null;
    }
  }

  return isJSONContentTree(value) && value.type === "doc" && Array.isArray(value.content)
    ? value
    : null;
}

/**
 * Normalizes any potential Tiptap document input, converting invalid or empty
 * structures (like empty '{}' objects, undefined values, or raw JSON strings)
 * safely into a valid, standard ProseMirror JSONContent tree.
 */
export const normalizeJSONContent = (value: unknown): JSONContent => {
  const content = parseJSONContent(value);
  return content && content.content?.length ? content : EMPTY_DOC;
};

export const normalizeRichTextDocument = normalizeJSONContent;
