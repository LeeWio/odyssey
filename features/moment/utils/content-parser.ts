import type { JSONContent } from "@tiptap/core";
import { normalizeJSONContent } from "@/components/rich-text/utils/document-normalizer";

export const parseMomentContent = (content: string): JSONContent => {
  if (content.trim().startsWith("{")) {
    try {
      const parsed = normalizeJSONContent(content);
      if (parsed && parsed.content && parsed.content.length > 0) {
        // If it is just an empty paragraph (EMPTY_DOC fallback), don't return it; fallback instead
        const isDefaultEmpty =
          parsed.content.length === 1 &&
          parsed.content[0].type === "paragraph" &&
          (!parsed.content[0].content || parsed.content[0].content.length === 0);

        if (!isDefaultEmpty) {
          return parsed;
        }
      }
    } catch {
      // ignore and fallback
    }
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
