import type { JSONContent } from "@tiptap/react";

// The minimal valid, standard ProseMirror document structure
export const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/**
 * Normalizes any potential Tiptap document input, converting invalid or empty
 * structures (like empty '{}' objects, undefined values, or raw JSON strings)
 * safely into a valid, standard ProseMirror JSONContent tree.
 */
export const normalizeJSONContent = (value: unknown): JSONContent => {
  if (!value) return EMPTY_DOC;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && parsed.type === "doc" ? parsed : EMPTY_DOC;
    } catch {
      return EMPTY_DOC;
    }
  }

  const obj = value as Record<string, unknown>;
  return obj && obj.type === "doc" ? (obj as JSONContent) : EMPTY_DOC;
};
