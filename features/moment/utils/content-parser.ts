import type { JSONContent } from "@tiptap/core";
import { normalizeJSONContent } from "@/components/rich-text/utils/document-normalizer";

export const parseMomentContent = (content: string): JSONContent => {
  if (content.trim().startsWith("{")) {
    try {
      // Validate that it is actually valid JSON first before trying to normalize it.
      // If it is invalid/corrupted JSON (e.g., "{broken json string"), JSON.parse will throw
      // and we will gracefully fall through to the plain text fallback.
      JSON.parse(content);

      const parsed = normalizeJSONContent(content);
      if (parsed && parsed.content && parsed.content.length > 0) {
        // If it is just an empty paragraph (EMPTY_DOC fallback), return a clean empty doc
        const isDefaultEmpty =
          parsed.content.length === 1 &&
          parsed.content[0].type === "paragraph" &&
          (!parsed.content[0].content || parsed.content[0].content.length === 0);

        if (isDefaultEmpty) {
          return {
            type: "doc",
            content: [],
          };
        }
        return parsed;
      }
    } catch {
      // ignore and fallback to plain text
    }
  }

  // If content is just empty or whitespace, return clean empty doc instead of rendering empty text
  if (!content.trim()) {
    return {
      type: "doc",
      content: [],
    };
  }

  // Plain text fallback
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      },
    ],
  };
};

export const isDocumentEmpty = (doc: JSONContent | null | undefined): boolean => {
  if (!doc) return true;
  if (!doc.content || doc.content.length === 0) return true;

  const hasText = (nodes: JSONContent[]): boolean => {
    for (const node of nodes) {
      if (node.type === "text" && node.text && node.text.trim().length > 0) {
        return true;
      }
      if (node.content && node.content.length > 0) {
        if (hasText(node.content)) return true;
      }
    }
    return false;
  };

  return !hasText(doc.content);
};
