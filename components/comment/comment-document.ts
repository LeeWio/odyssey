import type { Extensions, JSONContent } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";

export const COMMENT_MAX_LENGTH = 1000;

export const commentExtensions: Extensions = [
  StarterKit.configure({ link: { openOnClick: false } }),
];

export const emptyCommentDocument = (): JSONContent => ({
  type: "doc",
  content: [{ type: "paragraph" }],
});

export function serializeCommentDocument(document: JSONContent): string {
  return JSON.stringify(document);
}

export function parseCommentDocument(content: string): JSONContent {
  try {
    const parsed = JSON.parse(content) as JSONContent;
    if (parsed?.type === "doc") return parsed;
  } catch {
    // Older comments were stored as plain text.
  }
  return {
    type: "doc",
    content: content
      .split(/\r\n?|\n/)
      .map((line) =>
        line
          ? { type: "paragraph", content: [{ type: "text", text: line }] }
          : { type: "paragraph" }
      ),
  };
}
