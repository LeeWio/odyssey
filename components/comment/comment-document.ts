import type { Extensions, JSONContent } from "@tiptap/core";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { StarterKit } from "@tiptap/starter-kit";

export const COMMENT_MAX_LENGTH = 1000;

export const commentExtensions: Extensions = [
  StarterKit,
  Underline,
  Link.configure({ openOnClick: false }),
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
    // Content that is not a document falls through to an empty editor.
  }
  return emptyCommentDocument();
}
