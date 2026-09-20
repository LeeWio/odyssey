import { generateText, isNodeEmpty, type JSONContent } from "@tiptap/core";
import { momentContentExtensions, momentContentSchema } from "./content-schema";

/** Decode the API string; Tiptap's schema owns document parsing and validation. */
export const parseMomentContent = (content: string): JSONContent => {
  try {
    const node = momentContentSchema.nodeFromJSON(JSON.parse(content));
    if (node.type === momentContentSchema.topNodeType) {
      if (node.childCount === 0) return momentContentSchema.topNodeType.createAndFill()!.toJSON();
      node.check();
      return node.toJSON();
    }
  } catch {
    // Legacy text and unreadable documents remain literal, never interpreted as HTML.
  }

  return momentContentSchema.topNodeType
    .create(
      null,
      momentContentSchema.nodes.paragraph.create(
        null,
        content ? momentContentSchema.text(content) : undefined
      )
    )
    .toJSON();
};

export const isDocumentEmpty = (doc: JSONContent | null | undefined): boolean =>
  !doc || isNodeEmpty(momentContentSchema.nodeFromJSON(doc), { ignoreWhitespace: true });

/** Plain text is only for the dashboard table's compact summary. */
export const extractMomentPlainText = (content: string): string =>
  generateText(parseMomentContent(content), momentContentExtensions).trim();
